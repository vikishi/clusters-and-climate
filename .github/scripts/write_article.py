#!/usr/bin/env python3
"""
Reads a GitHub issue and uses Claude to write a full blog article,
then commits it to a new branch and opens a PR.
"""
import anthropic
import os
import re
import subprocess
from datetime import date


SERIES_PHILOSOPHY = """
Series philosophy (Green Cloud / Kubernetes Systems Thinking):
- Focus on design intent, not moral pressure
- Examine development and testing environments, not just production
- Separate cost from carbon — they are not the same thing
- Emphasize clarity, trade-offs, and engineering maturity
- Avoid dashboard-driven sustainability narratives
- Write for senior engineers who care about systems thinking
- Author: Dr. Vivek Shilimkar
"""


def slugify(title):
    title = title.lower()
    title = re.sub(r'[^\w\s-]', '', title)
    title = re.sub(r'[\s_]+', '-', title.strip())
    title = re.sub(r'-+', '-', title)
    return title


def extract_tags_from_labels(labels_str):
    base_tags = ["greencloud", "sustainability", "cloud", "kubernetes"]
    if labels_str:
        for label in labels_str.split(','):
            label = label.strip().lower()
            if label and label != 'write-article':
                base_tags.append(label)
    return list(dict.fromkeys(base_tags))  # deduplicate, preserve order


def main():
    client = anthropic.Anthropic()

    issue_title = os.environ['ISSUE_TITLE']
    issue_body = os.environ.get('ISSUE_BODY', '')
    issue_number = os.environ['ISSUE_NUMBER']
    labels_str = os.environ.get('ISSUE_LABELS', '')

    today = date.today().isoformat()
    slug = slugify(issue_title)
    branch_name = f"article/{slug}"
    filepath = f"content/technology/{slug}.md"

    # --- Write the article ---
    article_prompt = f"""You are writing a technical blog article for clustersandclimate.com, a blog by Dr. Vivek Shilimkar.

{SERIES_PHILOSOPHY}

Article title: {issue_title}

Issue body (brief, outline, or background):
{issue_body}

Write a complete, publication-ready article in Markdown. Guidelines:
- Write in first person, as Dr. Vivek Shilimkar
- Use ## for main section headers, ### for subsections
- Include concrete examples with real numbers where appropriate
- Length: 1500–2500 words
- Tone: analytical, pragmatic, accessible to senior engineers
- Avoid moralizing; focus on engineering trade-offs and systems thinking
- End with a forward-looking but grounded conclusion
- Close with an italicized note placing this article in the series context

Output ONLY the article body — no frontmatter, no code fences. Start directly with the opening paragraph."""

    print(f"Generating article: {issue_title}")
    article_message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        messages=[{"role": "user", "content": article_prompt}],
    )
    article_body = article_message.content[0].text.strip()

    # --- Generate SEO description ---
    desc_message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        messages=[{
            "role": "user",
            "content": f"Write a concise SEO meta description (under 160 characters, no quotes) for a technical blog article titled: {issue_title}"
        }],
    )
    description = desc_message.content[0].text.strip().strip('"\'')[:160]

    tags = extract_tags_from_labels(labels_str)
    tags_yaml = str(tags).replace("'", '"')

    frontmatter = f"""---
title: "{issue_title}"
date: {today}
author: Dr. Vivek Shilimkar
description: "{description}"
tags: {tags_yaml}
categories: ["technology"]
image: "/images/tech/{slug}.png"
---

"""
    content = frontmatter + article_body + "\n"

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Wrote article to {filepath}")

    # --- Git: branch, commit, push ---
    subprocess.run(["git", "config", "user.email", "vivek.shilimkar@gmail.com"], check=True)
    subprocess.run(["git", "config", "user.name", "vivek-shilimkar"], check=True)
    subprocess.run(["git", "checkout", "-b", branch_name], check=True)
    subprocess.run(["git", "add", filepath], check=True)
    subprocess.run([
        "git", "commit", "-m",
        f"Add article: {issue_title}\n\nAuto-generated from issue #{issue_number}."
    ], check=True)
    subprocess.run(["git", "push", "origin", branch_name], check=True)
    print(f"Pushed branch {branch_name}")

    # --- Open PR ---
    pr_body = f"""## {issue_title}

Auto-generated article from issue #{issue_number}.

**Please review before merging:**
- [ ] Prose and accuracy look good
- [ ] Add hero image at `assets/images/tech/{slug}.png`
- [ ] Deploy with `./deploy.sh`

Closes #{issue_number}
"""
    subprocess.run([
        "gh", "pr", "create",
        "--title", f"Article: {issue_title}",
        "--body", pr_body,
        "--base", "master",
        "--head", branch_name,
    ], check=True)
    print("PR created.")


if __name__ == "__main__":
    main()
