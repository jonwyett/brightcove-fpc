# Phase 1: Get Video Metadata

## Overview

This phase is responsible for retrieving a complete inventory of all videos in the Brightcove account and saving their metadata into a structured CSV file. This CSV will serve as the canonical source for review, filtering, and future download/upload operations. No video files are downloaded during this phase.

## Goals

* Retrieve all video metadata available from the Brightcove CMS API
* Save a comprehensive manifest to CSV for human review and annotation
* Ensure the process is safe to rerun and resilient to network/API failures
* Provide all metadata necessary for later filtering, downloading, and uploading
* Avoid duplication by recognizing previously downloaded video IDs

## Output

A single CSV file containing one row per video, including:

* **Brightcove metadata** (e.g., video ID, title, tags, publish date)
* **Project metadata** (e.g., match status, download flags, manual notes)

This file will be treated as the "ground truth" for the remainder of the project and may be edited manually.

## Key Requirements

### Metadata Retrieval

* Use the Brightcove CMS API to paginate through all videos
* For each video, extract all metadata fields provided by the API (excluding custom fields)
* Respect Brightcove rate limits by introducing pauses or adaptive backoff if necessary
* Detect and skip any videos already listed in the existing CSV by `video_id`

### CSV Fields (Dynamic)

* Dynamically map and flatten the fields returned by Brightcove
* Save all base metadata fields, including nested ones when feasible (e.g., flattening `sources` or `images` as stringified fields)

#### Project Metadata (manual/computed)

* `match`: Boolean|null — whether this video appears to be one of ours
* `match_type`: String — e.g., `title`, `date`, `manual`, `none`
* `match_score`: Number — optional confidence value (format TBD)
* `event_name`: String — best-guess event name match
* `downloaded`: Boolean — whether the video has been downloaded
* `uploaded`: Boolean — whether the video has been uploaded
* `last_checked`: Timestamp — when this row was last updated by the script
* `notes`: String — human-entered comments or flags

> Note: The final CSV schema may evolve as we gain familiarity with the Brightcove data.

## Script Behavior

* **Authentication**: Use OAuth2 with read-only scopes:

  * `video-cloud/video/read`
  * `video-cloud/asset/read`
* **Pagination**: Walk through all pages of videos using Brightcove's CMS API
* **Metadata Pull**: For each video, collect the above-listed fields
* **CSV Output**:

  * Create the CSV if it doesn't exist
  * Load existing CSV and skip any `video_id` already present
  * Append new rows to the CSV dynamically based on available fields
  * Never erase manually edited fields (e.g., match status)
* **Error Handling**:

  * If metadata can't be fetched, log the error and continue
  * Use retry logic with exponential backoff for transient failures
  * Pause between pages if API rate limits are encountered

## Manual Review

Once the CSV is generated:

* Stakeholders will review the file
* Manually mark videos as `match = true` and populate `match_type`, `match_score`, etc.
* This reviewed file becomes the canonical input for the next phase (download/upload)

## Considerations

* **Rate Limiting**: Brightcove may throttle requests; respect backoff headers
* **Parallelism**: Optional, but must avoid overwriting shared CSV
* **Re-runnability**: Must be safe to re-execute without duplication or loss of review data
* **Extendibility**: May add derived fields (e.g., event\_date proximity) later
* **Initial Testing**: Begin with a limited run (e.g., 5–10 videos) to verify schema detection and CSV formatting before running a full export

## Next Steps

* Finalize API access credentials
* Run a small batch (e.g., limit=10) to validate API output shape and CSV handling
* Implement logic to load existing CSV and avoid duplicate `video_id` entries
* Validate pagination logic and begin full-scale export in stages
