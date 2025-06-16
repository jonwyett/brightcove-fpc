# Project Overview: Brightcove Video Migration to Google Drive

## Purpose

This project aims to migrate video content owned by our office from a shared Brightcove account to a Google Drive folder. The goal is to create a reliable, auditable, and partially automated process that identifies relevant videos, downloads them, and uploads them to a shared cloud storage location for long-term retention.

Due to the complexity and shared nature of the Brightcove environment, this project is broken into distinct, auditable phases. Each phase produces outputs that can be reviewed and adjusted manually to ensure accuracy and avoid data loss or unauthorized access.

## Scope

* Access and inventory all videos from the Brightcove account using the CMS API
* Filter and identify only the videos relevant to our office
* Download identified videos in a staged and resumable fashion
* Upload downloaded videos to Google Drive, handling authentication and quota considerations
* Generate and maintain CSV logs throughout the process for transparency and tracking

## Phase Summary

### Phase 1: Get Video Metadata

* Connects to Brightcove CMS API using read-only credentials
* Retrieves all videos and saves their metadata to a CSV manifest
* This CSV serves as the canonical dataset for filtering and later operations

### Phase 2: Filtering

* Applies multiple logic passes to identify relevant videos:

  * Tag-based matching (positive and negative)
  * Uploader-based matching
  * Fuzzy event matching using an external list of known event names and dates
* Updates the manifest CSV with `match` status and confidence metadata
* Supports tri-state logic (`true`, `false`, `null`) for flexible review workflows
* Allows manual edits for final review

### Phase 3: Download and Upload

* Uses the filtered CSV to locate and download video files from Brightcove
* Tracks download status and failures
* Uploads each downloaded file to a designated Google Drive folder
* Handles network errors, retries, and quota-aware throttling
* Ensures final CSV records completion status for each file

## Design Principles

* **Auditability**: Every action is logged via CSV, enabling manual review and accountability
* **Safety**: No destructive actions on Brightcove; uses read-only permissions
* **Modularity**: Each phase can be developed, tested, and run independently
* **Resilience**: Script design anticipates errors and supports re-runs without duplication
* **Manual Control**: Users can inspect, edit, and rerun scripts based on project status

## Assumptions & Requirements

* Admin credentials will be required to access Brightcove CMS API with the correct scopes
* Google Drive access will be managed via service account or OAuth, pending organizational policy
* The existing event list for fuzzy matching will be provided in CSV format
* Collaboration may require placing CSV files in a shared workspace (e.g., Google Sheets or Shared Drive)

## Status

* Phase 1 and 2 are defined and ready for implementation
* Waiting on API credentials from Brightcove admin before Phase 1 coding begins

## Next Steps

* Begin implementation of Phase 1: Metadata Harvesting
* Confirm field availability and schema from Brightcove API response
* Validate Drive upload options and authentication model
* Design Phase 3 based on the confirmed filtering output structure
