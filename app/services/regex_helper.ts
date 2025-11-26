export function extractMentions(text: string): number[] {
  const regex = /@(\d+)/g; // Regular expression to match @ followed by one or more digits
  const matches = [...text.matchAll(regex)]; // Find all matches

  // Extract and return the numeric user IDs from the matches
  return matches.map(match => parseInt(match[1], 10));
}