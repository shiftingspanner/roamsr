# Standalone Connection Explorer for Roam Research

A lightweight tool to explore well-learned spaced repetition cards in your knowledge graph.

## Quick Start

1. Copy the entire contents of `standalone-connection-explorer.js`
2. In Roam Research, create a new block with `{{[[roam/js]]}}`
3. Paste the code into the code block that appears
4. A "🔗 Explore Connections" button will appear in your left sidebar
5. Click it to start exploring!

## What It Does

The Connection Explorer identifies your **well-learned** spaced repetition cards and displays them one-by-one, allowing you to:
- Explore connections in your knowledge graph
- Navigate to related blocks
- Mark explored cards with `#.connected` tag
- Focus on high-quality content you've already mastered

## How It Works

Instead of recalculating the eFactor (like the full plugin does), this standalone version uses a **simpler approach**:

1. **Examines review history** already stored in your Roam graph
2. **Calculates quality metrics**:
   - Total number of reviews
   - Success rate (percentage of "Good" or "Easy" responses)
   - Quality score (reviews × success rate)
3. **Filters cards** based on configurable thresholds
4. **Displays cards** sorted by quality (best first)

## Configuration

Edit these values at the top of the script:

```javascript
const CONFIG = {
    MIN_REVIEWS: 5,              // Minimum number of reviews required
    MIN_SUCCESS_RATE: 0.7,       // Minimum 70% success rate
    SR_TAGS: ["sr"],             // Tags used for spaced repetition
    CONNECTED_TAG: ".connected", // Tag to mark explored cards
    FLAG_TAG: "f",               // Flagged cards are excluded
};
```

## Features

- **Self-contained**: No dependencies on the roam/sr plugin
- **Lightweight**: Only ~488 lines of code
- **Visual interface**: Clean UI matching Roam's design language
- **Easy to modify**: All code in one file
- **Quality-based**: Focuses on your best-reviewed content

## How Cards Are Scored

- **Reviews**: More reviews = higher score
- **Success Rate**: % of reviews marked "Good" (r/3) or "Easy" (r/4)
- **Quality Score**: Reviews × Success Rate

Example:
- Card A: 10 reviews, 80% success → Score: 8.0
- Card B: 20 reviews, 60% success → Score: 12.0
- Card B appears first (higher quality score)

## Usage Tips

1. **Adjust thresholds** to control which cards appear
2. **Use the embedded block view** to explore related content
3. **Mark as Connected** when you've explored the connections
4. **Skip** cards you want to explore later
5. Cards marked with `#.connected` won't appear in future sessions

## Differences from Full Plugin Integration

| Feature | Full Plugin | Standalone |
|---------|-------------|------------|
| Size | 74KB, 2322 lines | ~15KB, 488 lines |
| Installation | Roam Depot / Extension | Paste in code block |
| Calculation | Full Anki algorithm | Simple heuristic |
| Dependencies | Requires roam/sr | Fully independent |
| Customization | Harder to modify | Easy to edit |
| UI Integration | Sidebar widget | Sidebar widget |

## Troubleshooting

**No cards found?**
- Lower `MIN_REVIEWS` (try 3 instead of 5)
- Lower `MIN_SUCCESS_RATE` (try 0.6 or 0.5)
- Make sure you have cards tagged with `#sr` (or your configured tag)
- Ensure cards have review history

**Widget doesn't appear?**
- Refresh the page
- Check browser console for errors
- Make sure the code is in a `{{[[roam/js]]}}` block

**Want to reset?**
- End the current session
- Remove `#.connected` tags from blocks you want to see again

## License

MIT (same as the parent roam/sr project)
