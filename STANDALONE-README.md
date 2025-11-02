# Standalone Connection Explorer for Roam Research

A lightweight tool to explore spaced repetition cards with high eFactor values in your knowledge graph.

## Quick Start

1. Copy the entire contents of `standalone-connection-explorer.js`
2. In Roam Research, create a new block with `{{[[roam/js]]}}`
3. Paste the code into the code block that appears
4. A "🔗 Explore Connections" button will appear in your left sidebar
5. Click it to start exploring!

## What It Does

The Connection Explorer displays cards with **eFactor > 3.0** one-by-one, allowing you to:
- Explore connections in your knowledge graph
- Navigate to related blocks
- Mark explored cards with `#.connected` tag
- Focus on well-learned content

## How It Works

This tool is **extremely simple**:

1. **Reads the eFactor attribute** from your SR card blocks
2. **Filters cards** with eFactor > 3.0 (configurable)
3. **Excludes** cards already tagged with `#.connected`
4. **Displays cards** sorted by eFactor (highest first)

### eFactor Storage Format

The tool looks for an `eFactor` attribute stored as a child block:

```
- Your SR card question #sr
  - eFactor:: 3.5
```

The eFactor value must be stored this way for the tool to find it.

## Configuration

Edit these values at the top of the script:

```javascript
const CONFIG = {
    MIN_EFACTOR: 3.0,            // Minimum eFactor value
    SR_TAGS: ["sr"],             // Tags used for spaced repetition
    CONNECTED_TAG: ".connected", // Tag to mark explored cards
};
```

## Features

- **Ultra-lightweight**: Only **419 lines** of code (~12KB)
- **Self-contained**: No dependencies
- **Simple**: Just reads eFactor from block attributes
- **Visual interface**: Clean UI matching Roam's design
- **Easy to customize**: All code in one file

## Usage

### Starting a Session

1. Click "🔗 Explore Connections" in the sidebar
2. The tool loads all cards with eFactor > 3.0
3. You'll be taken to the first card (highest eFactor)

### During Exploration

- **Embedded block view** shows the card in context
- **Navigate freely** - click links, explore connections
- **Return button** appears when you navigate away
- **Mark as Connected** button tags the card with `#.connected`
- **Skip** button moves to next card without tagging

### Ending a Session

- Click "✕ End Explorer" in the sidebar
- Or explore all cards (session auto-ends)

## Why eFactor > 3.0?

In spaced repetition systems:
- **eFactor = 2.5**: Default starting value
- **eFactor < 2.5**: Difficult cards
- **eFactor > 2.5**: Cards you're learning well
- **eFactor > 3.0**: Cards you consistently answer correctly

Cards with eFactor > 3.0 represent **well-established knowledge** - perfect for exploring deeper connections!

## Troubleshooting

### No cards found?

**Check if your cards have eFactor attributes:**
```
- Your SR card #sr
  - eFactor:: 3.5    ← Must be present!
```

**Try lowering the threshold:**
```javascript
MIN_EFACTOR: 2.5,  // Instead of 3.0
```

**Check your SR tags:**
```javascript
SR_TAGS: ["sr", "card"],  // Add your custom tags
```

### Widget doesn't appear?

- Refresh the page
- Check browser console for errors
- Make sure code is in a `{{[[roam/js]]}}` block

### Want to re-explore cards?

Remove the `#.connected` tag from blocks you want to see again.

## Comparison: Full Plugin vs Standalone

| Feature | Full Plugin | Standalone |
|---------|-------------|------------|
| Size | 74KB, 2322 lines | 12KB, 419 lines |
| Installation | Plugin system | Paste in code block |
| eFactor Source | Calculates from history | Reads from attribute |
| Flag Tag Support | Yes | No (removed) |
| Dependencies | Full roam/sr | None |
| Customization | Complex | Very easy |

## How to Store eFactor Attributes

If you're using roam/sr or another SR plugin, you may need to configure it to store eFactor values as attributes. Alternatively, you can manually add them to test:

```
- Test card with high eFactor #sr
  - eFactor:: 3.5
  - This is a well-learned card!
```

## License

MIT (same as the parent roam/sr project)
