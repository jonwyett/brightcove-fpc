# Phase 2: Filtering

## Overview

This phase enriches the video metadata manifest generated in Phase 1 by applying filtering logic to identify which videos are likely to belong to our office. The goal is to categorize videos as definite matches, definite non-matches, or unknowns based on tags, uploader identity, and fuzzy event title/date correlations.

The result of this phase is an updated version of the CSV manifest, with additional fields describing match status and how that status was determined. This CSV becomes the reviewed input for download/upload operations in Phase 3.

## Matching Strategy

Filtering is performed in multiple passes, with progressively stronger matching logic. All string comparisons should be **case-insensitive** and robust to extra whitespace.

### Match Status Logic

Videos are initialized with:

* `match = null` (unknown)

As filtering progresses:

* A **positive match** sets `match = true` and assigns a `match_type` (e.g., `tag_positive`, `user`, `event`)
* A **negative match** sets `match = false` and assigns a `match_type` (e.g., `tag_negative`)
* Positive matches always override previous negative results

This tri-state model (`null`, `false`, `true`) allows reviewers and scripts to distinguish between evaluated and untouched records.

## Filter Passes

### 1. Tag-Based Matching

**Positive Matches:**
If video tags include any of the following (case-insensitive, partial matches allowed):

* `Foreign Press Center`
* `FPC`
* `DCFPC`
* `NYFPC`

→ Set `match = true`, `match_type = tag_positive`, `match_score = 1.0`

**Negative Matches:**
If video tags include terms likely to indicate other offices (e.g., `State Department`) **and** the video has no positive tags:

* Set `match = false`, `match_type = tag_negative`

Positive tags always take precedence over negative ones.

### 2. Uploader-Based Matching

If the video was uploaded by a known user account from our office:

* Set `match = true`, `match_type = user`, `match_score = 1.0`

Uploader accounts must be pre-configured as a list.

### 3. Fuzzy Event Matching

An external CSV of known events is used for this match. Each event record contains:

* `event_name`
* `event_date`

Each video is compared to all events using the following logic:

1. **Date Match**: Does video publish date match `event_date` or `event_date + 1`?
2. **Title Match**: Are there shared non-trivial words between video title and event name?

Use a basic stopword filter (`the`, `of`, `and`, etc.)

**Match Score Calculation:**

```js
match_score = matched_words / total_event_words
```

Set thresholds:

* `>= 0.5` = strong match
* `0.25 to 0.49` = possible match (manual review)
* `< 0.25` = no match

If match found:

* Set `match = true`
* `match_type = event`
* Include `match_score`, `matched_event_name`, and optionally `matched_terms`

## Output

The CSV manifest will be updated with these additional fields:

| Column               | Type          | Description                                           |
| -------------------- | ------------- | ----------------------------------------------------- |
| `match`              | Boolean\|null | Final inclusion decision                              |
| `match_type`         | String        | e.g., `tag_positive`, `user`, `event`, `tag_negative` |
| `match_score`        | Float         | Confidence score for fuzzy/event matches              |
| `match_source`       | String        | Name of logic phase or script that applied the match  |
| `matched_event_name` | String        | Name of the matched event from event list             |
| `matched_terms`      | String\[]     | Words matched during fuzzy logic pass (optional)      |

Unmatched rows will remain with `match = null` and can be targeted for manual review or new filtering logic.

## Review Workflow

* After this phase, the CSV is considered enriched and review-ready
* Stakeholders may edit `match` and `match_type` fields manually
* This file becomes the input for Phase 3: Download and Upload

## Reusability

This filtering phase may be re-run as logic evolves or event lists are updated. Scripts must:

* Avoid overwriting manually edited `match` values unless explicitly instructed
* Log match reasons and sources for transparency

## Next Steps

* Implement tag and user-based matchers
* Normalize event list input format
* Prototype fuzzy matcher with stopword filtering and score calculation
* Generate audit logs or summary reports if needed
