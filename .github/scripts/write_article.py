#!/usr/bin/env python3
"""
Reads a GitHub issue and uses Claude to write a full blog article,
then commits it to a new branch and opens a PR.
"""
import anthropic
import json
import os
import re
import subprocess
from datetime import date


BLOG_CONTEXT = """
Blog: clustersandclimate.com — personal writing by Dr. Vivek Shilimkar.
Topics: green cloud, Kubernetes, climate science, science communication, outdoor adventures, diary.
Author voice: analytical, clear, first-person. Avoids moralising. Focuses on evidence, trade-offs, and systems thinking.
"""

CATEGORIES = ["technology", "climate", "science", "outdoor", "life", "diary"]

# Image subfolder per category
IMAGE_FOLDER = {
    "technology": "tech",
    "climate":    "climate",
    "science":    "science",
    "outdoor":    "outdoor",
    "life":       "life",
    "diary":      "life",
}

WRITING_TONE = {
    "technology": "analytical and pragmatic, targeting senior engineers. Focus on systems thinking, trade-offs, and concrete examples with real numbers.",
    "climate":    "rigorous science communication for an educated general reader. Cite specific research, statistics, and case studies. Explain mechanisms clearly without oversimplifying.",
    "science":    "curious and explanatory, bridging technical depth and accessibility. Ground abstract concepts in real-world examples.",
    "outdoor":    "personal and vivid. First-person narrative with sensory detail. Reflective but grounded.",
    "life":       "warm and reflective. Personal observations and experiences. Thoughtful but conversational.",
    "diary":      "intimate and personal. Can be informal. May include Marathi expressions where natural.",
}


def slugify(title):
    title = title.lower()
    title = re.sub(r'[^\w\s-]', '', title)
    title = re.sub(r'[\s_]+', '-', title.strip())
    title = re.sub(r'-+', '-', title)
    return title


def detect_category(client, title, body):
    """Use Claude Haiku to classify the article into one of the blog categories."""
    result = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=20,
        messages=[{
            "role": "user",
            "content": (
                f"Classify this blog article into exactly one category. "
                f"Categories: {', '.join(CATEGORIES)}.\n"
                f"Title: {title}\n"
                f"Brief: {body[:500]}\n"
                f"Reply with only the category name, nothing else."
            )
        }],
    )
    category = result.content[0].text.strip().lower()
    return category if category in CATEGORIES else "technology"


def generate_tags(client, title, body, category):
    """Use Claude Haiku to generate relevant tags for the article."""
    result = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=80,
        messages=[{
            "role": "user",
            "content": (
                f"Generate 4–7 lowercase tags for this blog article. "
                f"Return a JSON array of strings only, no explanation.\n"
                f"Category: {category}\nTitle: {title}\nBrief: {body[:300]}"
            )
        }],
    )
    try:
        tags = json.loads(result.content[0].text.strip())
        return [t.lower() for t in tags if isinstance(t, str)]
    except Exception:
        return [category]


def main():
    client = anthropic.Anthropic()

    issue_title  = os.environ['ISSUE_TITLE']
    issue_body   = os.environ.get('ISSUE_BODY', '')
    issue_number = os.environ['ISSUE_NUMBER']

    today      = date.today().isoformat()
    slug       = slugify(issue_title)
    branch_name = f"article/{slug}"

    # --- Detect category ---
    print(f"Detecting category for: {issue_title}")
    category   = detect_category(client, issue_title, issue_body)
    img_folder = IMAGE_FOLDER.get(category, category)
    filepath   = f"content/{category}/{slug}.md"
    image_path = f"/images/{img_folder}/{slug}.png"
    print(f"Category: {category} → {filepath}")

    # --- Write the article ---
    tone = WRITING_TONE.get(category, WRITING_TONE["science"])
    article_prompt = f"""You are writing a blog article for clustersandclimate.com.

{BLOG_CONTEXT}

Article title: {issue_title}
Category: {category}
Tone: {tone}

Detailed outline / brief from the issue:
{issue_body}

Write a complete, publication-ready article in Markdown. Requirements:
- Write in first person as Dr. Vivek Shilimkar
- Use ## for main section headers, ### for subsections
- Follow the outline closely — use the specific data, citations, and case studies provided
- Length: match the target length in the outline (default 1500–2000 words)
- Do not invent statistics; use only what is in the outline or is well-established fact
- End with a forward-looking conclusion that reflects the author's perspective

Output ONLY the article body — no frontmatter, no code fences. Start directly with the opening paragraph."""

    print(f"Generating article...")
    article_message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=5000,
        messages=[{"role": "user", "content": article_prompt}],
    )
    article_body = article_message.content[0].text.strip()

    # --- SEO description ---
    desc_message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        messages=[{
            "role": "user",
            "content": f"Write a concise SEO meta description (under 160 characters, no quotes) for a blog article titled: {issue_title}"
        }],
    )
    description = desc_message.content[0].text.strip().strip('"\'')[:160]

    # --- Tags ---
    tags = generate_tags(client, issue_title, issue_body, category)
    tags_yaml = str(tags).replace("'", '"')

    # --- Assemble file ---
    os.makedirs(f"content/{category}", exist_ok=True)
    frontmatter = f"""---
title: "{issue_title}"
date: {today}
author: Dr. Vivek Shilimkar
description: "{description}"
tags: {tags_yaml}
categories: ["{category}"]
image: "{image_path}"
---

"""
    with open(filepath, 'w') as f:
        f.write(frontmatter + article_body + "\n")
    print(f"Wrote {filepath}")

    # --- Git: branch, commit, push ---
    subprocess.run(["git", "config", "user.email", "vivek.shilimkar@gmail.com"], check=True)
    subprocess.run(["git", "config", "user.name", "vivek-shilimkar"], check=True)
    subprocess.run(["git", "checkout", "-b", branch_name], check=True)
    subprocess.run(["git", "add", filepath], check=True)
    subprocess.run(["git", "commit", "-m", issue_title], check=True)
    subprocess.run(["git", "push", "origin", branch_name], check=True)
    print(f"Pushed branch {branch_name}")

    # --- Open PR ---
    pr_body = f"""## {issue_title}

Auto-generated article from issue #{issue_number}.

**Please review before merging:**
- [ ] Prose and accuracy look good
- [ ] Add hero image at `assets/images/{img_folder}/{slug}.png`
- [ ] Deploy with `./deploy.sh "{issue_title}"`

Closes #{issue_number}
"""
    subprocess.run([
        "gh", "pr", "create",
        "--title", issue_title,
        "--body", pr_body,
        "--base", "master",
        "--head", branch_name,
    ], check=True)
    print("PR created.")


if __name__ == "__main__":
    main()
