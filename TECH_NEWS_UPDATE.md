# Tech News Integration Update

## Overview
The landing page has been updated to include a dynamic tech news section that fetches the latest technology news exclusively from GMA Network RSS feeds, including images for enhanced visual appeal.

## Changes Made

### 1. Updated API Route
- **File**: `src/app/api/tech-news/route.js`
- **Purpose**: Fetches tech news exclusively from GMA Network RSS feeds
- **Sources**: 
  - **GMA Network Technology, Gadgets and Gaming**: `https://data.gmanetwork.com/gno/rss/scitech/technology/feed.xml`
  - **GMA Network SciTech (General)**: `https://data.gmanetwork.com/gno/rss/scitech/feed.xml`
- **Features**: 
  - Fetches from 2 GMA Network RSS feeds only
  - Returns latest 12 news items sorted by date
  - **Image extraction and inclusion**
  - Includes fallback news if RSS feeds fail
  - Handles CORS and timeout issues

### 2. Updated Component
- **File**: `src/app/components/TechNewsSection.jsx`
- **Purpose**: Displays GMA Network tech news with images in an attractive card layout
- **Features**:
  - Real-time RSS feed integration
  - **Image display for each news item**
  - Responsive design with hover effects
  - Loading states and error handling
  - Source attribution and timestamps
  - Fallback content if API fails
  - **Error handling for missing images**

### 3. Updated Landing Page
- **File**: `src/app/page.js`
- **Changes**:
  - Added TechNewsSection component to hero area
  - Maintained existing design consistency
  - Added CSS for line-clamp utility
  - Preserved all existing functionality

## Dependencies Added
- `rss-parser`: For parsing RSS feeds from GMA Network

## RSS Feed Sources

### GMA Network Only
1. **GMA Network Technology, Gadgets and Gaming**: `https://data.gmanetwork.com/gno/rss/scitech/technology/feed.xml`
2. **GMA Network SciTech (General)**: `https://data.gmanetwork.com/gno/rss/scitech/feed.xml`

## Features
- **Real-time Updates**: News is fetched fresh on each page load
- **Philippine Focus**: Exclusively GMA Network content covering local and international tech news
- **Image Support**: Displays article images when available
- **Fallback System**: Shows curated tech news if RSS feeds are unavailable
- **Responsive Design**: Works on all device sizes
- **Performance Optimized**: Only shows 6 latest news items to maintain page speed
- **Visual Enhancement**: Images make the news section more engaging

## Image Handling
- **Automatic Extraction**: Images are automatically extracted from RSS feed content
- **Multiple Sources**: Checks content, content:encoded, and description fields for images
- **Error Handling**: Gracefully handles missing or broken images
- **Responsive Display**: Images are displayed at 80x80px with proper aspect ratio

## Usage
The tech news section automatically appears on the landing page for non-authenticated users. It displays the latest GMA Network technology news with:
- Article titles
- Article images (when available)
- Source attribution (GMA News Online)
- Publication timestamps
- Hover effects for better UX

## API Endpoint
- **URL**: `/api/tech-news`
- **Method**: GET
- **Response**: JSON array of news items with title, link, pubDate, source, description, and image

## Sample Content
The system now provides GMA Network content such as:
- "Albania appoints AI bot as minister to tackle corruption"
- "CHED calls for AI integration in schools"
- "Apple launches slimmer iPhone Air, new iPhone 17"
- "DICT-CICC wants 'zero tolerance' for online harms"
- "Malaysia pushes TikTok for age verification to protect minors"
- Weather updates and science news from the Philippines

## Future Enhancements
- Add caching to reduce API calls
- Implement news categories filtering
- Add search functionality
- Add social sharing buttons
- Add more Philippine tech news sources
- Implement image lazy loading for better performance
