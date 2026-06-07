# GitHub operation rules

- Use shared update-bundle workflows. Do not create update-specific workflows.
- Prepare and validate one complete bundle before the first write. Do not split writes by file or intermediate approach.
- GitHub approval prompts for the app and crawler combined must be kept to a maximum of three per development request.
- Do not transfer workflow failures to user-side manual GitHub operations. Diagnose logs and submit one corrected bundle.
- Record actual base commit IDs and distinguish Git blob SHA values from file SHA-256 values.
