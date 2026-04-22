function stripHost(path: string): string {
  return path.replace(/^https?:\/\/[^/]+/i, '');
}

function stripLeadingSegment(path: string): string {
  // Remove the first path segment: /bucket-name/rest -> /rest
  return path.replace(/^\/[^/]+/, '');
}

export function isUploadPathAllowed(filePath: string, expectedPrefix: string): boolean {
  const withoutHost = stripHost(filePath);
  if (withoutHost.startsWith(expectedPrefix)) return true;
  // Handle GCS public URLs where first path segment is bucket name
  const withoutBucket = stripLeadingSegment(withoutHost);
  return withoutBucket.startsWith(expectedPrefix);
}
