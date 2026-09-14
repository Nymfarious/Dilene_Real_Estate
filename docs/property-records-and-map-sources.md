# Property records and map-source guidance

Status: **verified implementation guidance** — not an owner decision and not
legal advice. No private test address is stored in this document.

## Public records can accelerate a draft, not certify it

The Gemini note supplied by the project owner points in a useful direction,
with one important correction: the availability and precision of sketches,
plans, and archived attachments varies by property. The application must never
describe them as guaranteed or exact.

For a Dallas County property:

- Start with the official [DCAD street-address search](https://www.dallascad.org/SearchAddr.aspx).
- DCAD appraisal/property data is useful for parcel and improvement research,
  but it is produced for taxation. The DCAD site itself says its information is
  informational and not a legal document.
- If a property record offers a section sketch or drawing, treat it as a
  sourced exterior-footprint lead. Do not infer interior wall positions from
  it.
- The City of Dallas [online building records page](https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/pages/online-records.aspx)
  supports permit/address searches. It directs requests for site plans and
  other historical documents through an open-records request; availability is
  not guaranteed.
- Realtor-only systems and historical MLS attachments may contain tax reports,
  builder plans, appraisal sketches, or floor-plan graphics. Q should record
  the source and confirm reuse rights before an attachment enters this app.

For the owner-approved Washington test residence, Dallas/DCAD sources do not
apply. The relevant public starting point is the official
[Snohomish County Assessor](https://snohomishcountywa.gov/assessor), which links
to property summaries, parcel maps, sales, and its SCOPI interactive map.
For a unit within a multi-unit building, county records may describe the parcel
or whole building rather than the unit's interior. Owner documents, builder or
permit plans, a Matterport-derived floor plan, or a physical measurement may
still be needed.

## Data rules for the application

Every imported measurement should carry:

- `source_type`: assessor, permit, MLS attachment, owner document, scan, or
  field measurement;
- `source_url_or_record`: a retrievable reference when permitted;
- `captured_at`: when the record was obtained;
- `scope`: parcel, exterior footprint, building, unit, or room;
- `confidence`: reference-only, approximate, measured, or professionally
  certified;
- `reuse_approved`: whether the underlying image/document may be published.

Only field measurements, an appropriate professional report, or an
owner-approved authoritative plan should drive claims presented as measured.
Assessor and archived-listing material can seed a draft and reduce field time,
but should remain visibly sourced and approximate.

## Map imagery for the scroll pull-away

Do not download, stitch, cache, or rehost Google Maps tiles or screenshots as
website animation frames. Google's current platform terms prohibit scraping,
storing, and rehosting Maps content outside the service, subject only to narrow
product-specific exceptions.

Two compliant paths remain:

1. **Live Google embed:** the Maps Embed API is currently available at no
   charge with unlimited requests, but requires a Google Cloud API key and a
   billing-enabled project. Google attribution must remain visible. This is
   suitable for an interactive locator, not for extracting animation frames.
2. **Owned animation frames:** obtain aerial imagery from a source whose terms
   permit downloading and derivative presentation, such as applicable USGS
   public-domain imagery, then generate the zoom ladder ourselves with source
   attribution. Verify coverage date and licensing for each selected layer.

The exact owner-approved test location is retained only in a local ignored
record. Public test pages use a masked street number and an approximate map
query. A future production listing can reveal an exact location only after the
owner explicitly approves that listing's publication policy.

