# What I Built

Over the course of the project, I wrote a suite of small, focused programs to tackle the problem in stages. Each script had a specific job, and each one built on the data from the last.

## 📡 API Access + Full Metadata Download

The first script securely connected to Brightcove's API, pulled down **every single video record**, and saved the metadata to a clean spreadsheet.

This included:

- Titles, descriptions, filenames, and uploaders
- Upload dates and video IDs
- Any available tags or categorization

It was built to be gentle: paginated API access, rate-limited requests, and safe retries to ensure we didn't hit any throttling issues or cause disruptions for other users. This gave us a complete offline record of the entire video library.

## 📄 Master Manifest

All that data was stored in a structured CSV file. This became the **source of truth** for all later analysis — and doubles as a full backup of everything in Brightcove, even if we never download the actual video files.

## The Identification Phase

Once we had the full dataset, the real work began: figuring out which videos were ours.

### ✅ Manual Keyword Matching

I wrote a script to scan video metadata for specific keywords and patterns. If a title or description mentioned something like "FPC", "DCFPC", or "NYFPC", it was flagged as a likely match.

We also checked the uploader field to identify known FPC upload accounts — a great signal when available.

A similar process looked for common negative signals like "State Department" to help screen out unrelated content.

Each match was logged with a score and match type, and nothing was ever overwritten without a human review step.

### 🔍 Fuzzy Event Matching

The most interesting part was fuzzy matching.

I fed the program a list of **known FPC events** (names and dates) and asked it to scan every video for *close matches* — not exact.

- If a video was uploaded on the same day (or within two days) of a known event
- And the title, description, or filename sounded similar to the event name

→ It flagged it as a potential match, with a confidence score and the field it matched against.

This is how we caught edge cases:

- Videos with generic titles but uploaded on the right day
- Slightly misspelled events
- Or cases where the name of a speaker mattered more than the event title

The process was careful not to override any manual decisions. And I built in a way to skip over anything we'd already marked as "definitely not ours."

## The Result

After combing through 14,000 videos:

- 🟢 **1,000+ videos were flagged as likely FPC content**
- 🟢 **Hundreds were directly linked to named FPC events**
- 🟢 **Every video was preserved in the manifest, matched or not**
- 🟢 **All match logic is logged, transparent, and reversible**

No content was deleted. No data was changed inside Brightcove. This was all discovery and prep work — laying the foundation for whatever comes next.

## What's Next

With the groundwork done, the next step is focused:

- Download just the matched videos
- Upload them into a Google Drive archive
- Build a shareable listing that links events to recordings

But the hardest part — *finding* our content — is behind us.
