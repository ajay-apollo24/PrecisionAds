# Test Data Summary - Creative Assets Management

## 🎯 Overview

This document summarizes all the test data that has been created in the database for testing the Creative Assets Management system. The data includes organizations, users, campaigns, creative assets, and more.

## 🏢 Organizations Created

### 1. Precision Ads Inc. (Admin)
- **ID**: `cmel727sb0000tuo2221003z8`
- **Type**: ADMIN
- **Domain**: precisionads.com
- **Status**: ACTIVE
- **Features**: Advanced analytics, AI optimization, RTB

### 2. TechCorp Media (Publisher)
- **ID**: `cmel727sf0001tuo2iipqmbc3`
- **Type**: PUBLISHER
- **Domain**: techcorp.com
- **Status**: ACTIVE
- **Ad Formats**: Banner, video, native

### 3. Fashion Forward Brands (Advertiser)
- **ID**: `cmel727sf0002tuo23kkxb1zb`
- **Type**: ADVERTISER
- **Domain**: fashionforward.com
- **Status**: ACTIVE
- **Target Audience**: Fashion, lifestyle, luxury

### 4. Digital Marketing Agency (Agency)
- **ID**: `cmel727sg0003tuo2ra56t7eq`
- **Type**: AGENCY
- **Domain**: digitalagency.com
- **Status**: ACTIVE
- **Services**: Campaign management, creative design, analytics

## 👥 Users Created

### 1. Super Admin
- **Email**: `superadmin@precisionads.com`
- **Password**: `superadmin123`
- **Role**: SUPER_ADMIN
- **Organization**: Precision Ads Inc.
- **Permissions**: All permissions

### 2. Admin User
- **Email**: `admin@precisionads.com`
- **Password**: `admin123`
- **Role**: ADMIN
- **Organization**: Precision Ads Inc.
- **Permissions**: Most permissions (excluding delete and super admin)

### 3. Publisher User
- **Email**: `publisher@techcorp.com`
- **Password**: `user123`
- **Role**: PUBLISHER
- **Organization**: TechCorp Media
- **Permissions**: Publisher-specific and read permissions

### 4. Advertiser User
- **Email**: `advertiser@fashionforward.com`
- **Password**: `user123`
- **Role**: ADVERTISER
- **Organization**: Fashion Forward Brands
- **Permissions**: Advertiser-specific and campaign permissions

### 5. Agency Manager
- **Email**: `manager@digitalagency.com`
- **Password**: `user123`
- **Role**: MANAGER
- **Organization**: Digital Marketing Agency
- **Permissions**: Manager-level permissions

## 🎨 Creative Assets Created

### 1. Summer Dress Collection Banner
- **ID**: `cmel729n6006htuo2mvg0kovy`
- **Type**: Image (JPEG)
- **Size**: 240KB
- **Dimensions**: 728x90
- **Status**: VALIDATED
- **Organization**: Fashion Forward Brands
- **Metadata**: Summer colors, fashion tags, brand info

### 2. Winter Coat Video Ad
- **ID**: `cmel729na006jtuo2agk3t93x`
- **Type**: Video (MP4)
- **Size**: 5MB
- **Dimensions**: 640x360
- **Duration**: 15 seconds
- **Status**: VALIDATED
- **Organization**: Fashion Forward Brands
- **Metadata**: Winter fashion, HD quality, 16:9 aspect ratio

### 3. Interactive HTML5 Banner
- **ID**: `cmel729nb006ltuo2rr9f0ezz`
- **Type**: HTML5
- **Size**: 15KB
- **Status**: VALIDATED
- **Organization**: Fashion Forward Brands
- **Metadata**: Interactive features, animation, click-tracking

### 4. Tech Conference Banner
- **ID**: `cmel729nd006ntuo2kayzvr9s`
- **Type**: Image (PNG)
- **Size**: 180KB
- **Dimensions**: 300x250
- **Status**: VALIDATED
- **Organization**: TechCorp Media
- **Metadata**: Tech colors, conference branding

## 🔄 Asset Versions Created

- **Summer Dress Banner**: Version 1 (active)
- **Summer Dress Banner**: Version 2 (active) - for testing versioning
- **Winter Coat Video**: Version 1 (active)
- **Interactive HTML5**: Version 1 (active)

## 📢 Campaigns Created

### 1. Summer Fashion Collection
- **ID**: `cmel729mk005ztuo2n8xwgqym`
- **Type**: DISPLAY
- **Budget**: $10,000 (daily)
- **Status**: ACTIVE
- **Duration**: 90 days
- **Target CPC**: $0.50

### 2. Winter Fashion Collection
- **ID**: `cmel729np0071tuo2seiffgvo`
- **Type**: VIDEO
- **Budget**: $15,000 (daily)
- **Status**: ACTIVE
- **Duration**: 120 days
- **Target CPM**: $8.50

### 3. Interactive Fashion Experience
- **ID**: `cmel729nq0073tuo2xdfo6zcz`
- **Type**: DISPLAY
- **Budget**: $8,000 (daily)
- **Status**: ACTIVE
- **Duration**: 75 days
- **Target CPC**: $0.75

## 🖼️ Ads Created

### 1. Summer Dress Banner
- **Creative Asset**: Summer Dress Collection Banner
- **Type**: IMAGE
- **Status**: ACTIVE
- **Targeting**: Fashion interests, age 18-45

### 2. Winter Coat Video Ad
- **Creative Asset**: Winter Coat Video Ad
- **Type**: VIDEO
- **Status**: ACTIVE
- **Targeting**: Winter fashion, age 25-55

### 3. Interactive HTML5 Banner
- **Creative Asset**: Interactive HTML5 Banner
- **Type**: HTML5
- **Status**: ACTIVE
- **Targeting**: Interactive fashion, age 18-35

## 👥 Audiences Created

### 1. Fashion Enthusiasts
- **Campaign**: Summer Fashion Collection
- **Size**: 50,000
- **Targeting**: Female, age 18-45, fashion interests

### 2. Winter Fashion Enthusiasts
- **Campaign**: Winter Fashion Collection
- **Size**: 75,000
- **Targeting**: Age 25-55, luxury fashion, winter interests

### 3. Digital Fashion Forward
- **Campaign**: Interactive Fashion Experience
- **Size**: 45,000
- **Targeting**: Age 18-35, tech-savvy, social media users

## 🔑 API Keys Created

### 1. Data Ingestion Key
- **Key**: `pwf9aop6v7lwvbmpyq6ul`
- **Organization**: TechCorp Media
- **User**: Publisher User
- **Scopes**: INGEST_WRITE, TRAITS_WRITE, COHORTS_WRITE
- **Status**: ACTIVE

### 2. Analytics Key
- **Key**: `9inq36x59df6isiwmcrx6t`
- **Organization**: Fashion Forward Brands
- **User**: Advertiser User
- **Scopes**: ANALYTICS_READ, INGEST_READ
- **Status**: ACTIVE

## 🌐 Publisher Sites & Ad Units

### TechCorp News
- **Ad Units**: Header Banner (728x90), Video Player (640x360)
- **Categories**: Technology, news
- **Formats**: Banner, video

### TechCorp Blog
- **Ad Units**: Native ads
- **Categories**: Technology, blog
- **Formats**: Banner, native

## 📊 Sample Analytics Data

- **Identities**: 1 sample user with traits and events
- **Traits**: User preferences, subscription tier
- **Cohorts**: Tech enthusiasts behavioral cohort
- **Events**: Page view events with properties
- **Earnings**: Sample publisher revenue data

## 🧪 Testing Scenarios

### Creative Assets Management
1. **Upload Testing**: Use the advertiser account to test file uploads
2. **Asset Library**: Browse and manage existing creative assets
3. **Asset Linking**: Test linking assets to campaigns and ads
4. **Version Management**: Test asset versioning with the summer dress banner

### Campaign Management
1. **Campaign Creation**: Create new campaigns with different creative assets
2. **Asset Assignment**: Assign creative assets to ads
3. **Audience Targeting**: Test audience creation and targeting

### Publisher Operations
1. **Site Management**: Manage publisher sites and ad units
2. **Revenue Tracking**: Monitor earnings and performance
3. **Ad Request Testing**: Test ad serving with sample requests

## 🚀 Getting Started

1. **Login**: Use the test credentials above
2. **Navigate**: Go to Creative Assets section in advertiser dashboard
3. **Test Upload**: Try uploading different file types
4. **Manage Assets**: Test asset management features
5. **Link to Campaigns**: Connect assets to advertising campaigns

## 🔧 Environment Setup

Make sure you have:
- Backend running on port 7401
- Frontend running on port 7400
- Database connection established
- Creative Assets routes integrated

## 📝 Notes

- All creative assets are marked as VALIDATED for immediate testing
- Asset versions are set up for testing versioning functionality
- Campaigns span different time periods for testing date-based features
- Multiple ad types (IMAGE, VIDEO, HTML5) are available for testing
- Sample metadata includes realistic brand and campaign information 