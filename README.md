# Commons & Code Website - Editing Guide

This guide will help you add blog articles or edit existing pages on the Commons & Code website, even if you've never used GitHub before.

## How to Edit an Existing Page

Follow these steps to edit any existing page on the website:

> [!IMPORTANT]
> Most pages exist in both German and English. Remember to edit both language versions to keep content synchronized!

### 1. Navigate to the File

1. Browse to the file you want to edit:
   - **German pages**: Go to `content/de/` and navigate to the page
   - **English pages**: Go to `content/en/` and navigate to the page
   - Example: To edit the transparency page, go to `content/de/ueber-uns/transparenz.md`

### 2. Start Editing

1. Click the **pencil icon** (✏️) in the top-right corner of the file view
1. This will open the file editor
1. Make your changes in the editor

### 3. Preview Your Changes (Optional)

1. Click the **"Preview"** tab at the top of the editor to see how your text will look
1. Switch back to the **"Edit"** tab to continue editing

### 4. Save Your Changes

1. Scroll down to the **"Commit changes"** section at the bottom
1. In the first text box, write a short description of what you changed
   - Use imperative mood: "Update team member bio" not "Updated team member bio"
   - Think: "If applied, this commit will... <your message>"
   - Example: "Add new board member" or "Fix typo in about page"
1. Optionally, add a longer description in the second box
1. Select **"Create a new branch for this commit and start a pull request"**
1. Click the green **"Propose changes"** button

### 5. Create a Pull Request (PR)

1. You'll be taken to a new page titled "Open a pull request"
1. Review the title and description (you can edit them if needed)
1. Click the green **"Create pull request"** button
1. Your changes are now submitted for review! A team member will review and merge them.

## How to Add a New Blog Article

Blog articles need to be created in both German and English. Here's how to create both on the same branch:

> [!TIP]
> **Optional: Adding a Featured Image**
> 
> If your blog post should have a featured image, create a folder instead of a file:
> 1. Instead of `article-name.md`, create a folder: `article-name/`
> 1. Inside that folder, create `index.md` (your blog post content)
> 1. Add your image file as `featured.png` or `featured.jpg` in the same folder
> 
> Example structure:
> ```
> content/de/blog/neues-projekt/
> ├── index.md
> └── featured.jpg
> ```

### Step 1: Create the German Blog Post

1. Navigate to `content/de/blog/`
1. Click the **"Add file"** dropdown button (top-right)
1. Select **"Create new file"**
1. In the "Name your file" box at the top, type your filename in German: `dein-artikel-name.md`
   - **Important**: The filename becomes part of the URL, so use German for German articles
   - Use only lowercase letters, numbers, and hyphens (-)
   - Example: `neues-projekt-ankuendigung.md`
   - **With featured image**: Type `dein-artikel-name/index.md` to create a folder
1. Copy and paste this template into the editor:

```markdown
---
title: "Your Article Title Here"
date: 2025-11-25
draft: false
description: "A short description of your article"
tags: ["tag1", "tag2"]
authors: ["authorkey"]
translationKey: "your-article-name"
---

{{< lead >}}
An optional lead paragraph that introduces your article with larger, emphasized text.
{{< /lead >}}

Write your article content here. You can use **bold text**, *italic text*, and [links](https://example.com).

## Subheading

More content here.

### Using Buttons

You can add styled buttons to link to other pages:

{{< button href="/de/ueber-uns/" target="_self" >}}
Button Text
{{< /button >}}
```

1. Replace the placeholder text:
   - `title`: Your article title in German
   - `date`: Today's date in YYYY-MM-DD format
   - `description`: A brief summary
   - `tags`: Relevant topic tags
   - `authors`: Your author key (ask a team member if you don't know yours)
   - `translationKey`: A unique English key for linking translations (e.g., "new-project-announcement")
   - Article content: Your actual blog post text

1. Scroll down to **"Commit changes"**
1. Write a commit message: "Add new blog post about [topic]"
1. Select **"Create a new branch for this commit and start a pull request"**
1. Name your branch something descriptive, like `blog/new-project-post`
1. Click **"Propose changes"**
1. On the Pull Request page, click **"Create pull request"**
1. **Don't merge yet!** You'll add the English version next.

### Step 2: Add the English Translation to the Same Branch

1. **Important**: At the top of the page, switch to your new branch:
   - Click the branch dropdown (says "main" by default)
   - Find and select your branch name (e.g., `blog/new-project-post`)
1. Navigate to `content/en/blog/`
1. Click **"Add file"** → **"Create new file"**
1. Name the file in English: `your-article-name.md` (English filename for English URL)
   - Example: `new-project-announcement.md`
   - **With featured image**: Type `your-article-name/index.md`
1. Paste the same template and translate all content to English:
   - Translate the title, description, and article content
   - **Keep the same `translationKey`** value (this links the translations)
   - Update button links to English URLs (e.g., `/en/about-us/`)
1. Scroll down to **"Commit changes"**
1. Write a commit message: "Add English translation of blog post"
1. **Important**: Select **"Commit directly to the `[your-branch-name]` branch"**
1. Click **"Commit changes"**
1. If you used featured images, repeat the upload process for `featured.png`/`featured.jpg` in the English folder
1. Your Pull Request now includes both language versions!

### Important Notes for Blog Posts

- **Filenames**: Use German filenames for German articles, English for English (they become URLs)
- **translationKey**: Always use English and keep it identical in both language versions
- The `translationKey` links the two versions so readers can switch languages
- **Featured Images**: Use `featured.png` or `featured.jpg` in the article folder (see optional section above)
- **Shortcodes**:
  - `{{< lead >}}...{{< /lead >}}` creates emphasized intro text
  - `{{< button href="..." >}}...{{< /button >}}` creates styled buttons
- Other images go in the `static/img/` folder (ask for help if you need to upload images)

## Markdown Formatting Tips

Here are some common formatting options you can use in your articles:

- `**bold text**` → **bold text**
- `*italic text*` → *italic text*
- `[link text](https://url.com)` → clickable link
- `## Heading` → Creates a heading
- `### Subheading` → Creates a smaller heading
- `- List item` → Creates a bullet point
- Numbered lists: Use `1.` for every item (makes editing easier):
  ```markdown
  1. First item
  1. Second item
  1. Third item
  ```

## What Happens Next?

After you create a pull request:

1. Team members will receive a notification
1. They will review your changes
1. They may ask questions or suggest edits (you'll get notified)
1. Once approved, they will merge your changes
1. The website will automatically update with your changes!

You can track the status of your pull request by going to the "Pull requests" tab in the repository.
