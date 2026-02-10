# Filter Presets Feature Guide

## Overview

The Filter Presets feature allows admin users to save and load custom filter configurations, making it easy to apply complex filter setups with a single click.

## Key Features

- **Admin-Only Access**: Only users with admin privileges can save and manage presets
- **Save Current Configuration**: Capture your current filter settings under a custom name
- **Quick Load**: Apply saved presets instantly to restore filter configurations
- **Preset Management**: View, load, and delete saved presets
- **Persistent Storage**: All presets are stored in Supabase and synced across sessions

## Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase SQL Editor:

```bash
# The SUPABASE_SETUP.sql file has been updated with:
# - users table with is_admin flag
# - filter_presets table with RLS policies
# - Automatic user creation trigger
```

Execute the updated `SUPABASE_SETUP.sql` in your Supabase project.

### 2. Set Admin Users

After running the SQL setup, promote users to admin via SQL:

```sql
-- Update a user to be admin (replace email with actual admin email)
UPDATE users
SET is_admin = true
WHERE email = 'admin@example.com';
```

### 3. Start Backend Server

The backend API server must be running for presets to work:

```bash
cd backend
python app.py
```

The API will be available at `http://localhost:8000`

### 4. Frontend Configuration

The frontend is already configured to communicate with the backend API. Ensure the API URL in PresetManager.tsx matches your backend:

```typescript
// Default: http://localhost:8000/api/presets
```

## Usage Guide

### For Admin Users

1. **Access Preset Manager**
   - Navigate to the Scanner page
   - Look for the "Presets" button in the filter controls (only visible to admins)
   - Click to open the Preset Manager panel

2. **Save a Preset**
   - Configure your filters as desired
   - Open the Preset Manager
   - Enter a preset name (required) and description (optional)
   - Click "Save Preset"
   - Your configuration is now saved

3. **Load a Preset**
   - Open the Preset Manager
   - Browse your saved presets
   - Click the upload icon next to the preset you want to load
   - All filters will be instantly applied

4. **Delete a Preset**
   - Open the Preset Manager
   - Click the trash icon next to the preset you want to remove
   - Confirm the deletion

### For Regular Users

Regular (non-admin) users will not see the Presets button and cannot access the preset management features.

## Technical Details

### Database Schema

**users table:**
- `id` - UUID, references auth.users
- `email` - User's email
- `full_name` - User's full name
- `is_admin` - Boolean flag for admin access
- `created_at` - Timestamp
- `updated_at` - Timestamp

**filter_presets table:**
- `id` - UUID primary key
- `name` - Preset name (unique per user)
- `description` - Optional description
- `filters` - JSONB containing filter configuration
- `created_by` - UUID, references users
- `created_at` - Timestamp
- `updated_at` - Timestamp

### API Endpoints

- `GET /api/presets` - List all presets for current admin user
- `GET /api/presets/{id}` - Get specific preset
- `POST /api/presets` - Create new preset
- `PUT /api/presets/{id}` - Update existing preset
- `DELETE /api/presets/{id}` - Delete preset

All endpoints require authentication and admin privileges.

### Security

- **Row Level Security (RLS)**: Enabled on both tables
- **Authentication Required**: All API calls require valid JWT token
- **Admin-Only Access**: Presets can only be created/read/updated/deleted by admin users
- **User Isolation**: Users can only modify their own presets

### Filter Serialization

Filters are automatically serialized for storage:
- `Set` objects are converted to arrays
- All other data types remain unchanged
- Deserialization restores Sets on load

## Troubleshooting

### "Not authenticated" error
- Ensure you're logged in
- Check that your session is valid
- Try logging out and back in

### "Admin access required" error
- Your user account needs admin privileges
- Contact a system administrator to set `is_admin = true` in the database

### "Preset with this name already exists" error
- Choose a different preset name
- Or delete the existing preset with the same name

### Backend connection errors
- Ensure the backend server is running on port 8000
- Check that CORS is properly configured
- Verify your Supabase credentials in backend `.env` file

## Best Practices

1. **Descriptive Names**: Use clear, descriptive names for your presets (e.g., "Tight Consolidation - High Volume")
2. **Add Descriptions**: Include descriptions to remember the purpose of each preset
3. **Regular Cleanup**: Delete unused presets to keep your list manageable
4. **Test Before Saving**: Verify your filter configuration works as expected before saving as a preset
5. **Backup Important Presets**: Consider documenting critical filter configurations separately

## Example Presets

Here are some example preset configurations:

**"Aggressive Breakouts"**
- Min Score: 80
- Max Distance: 2%
- Min ADR: 3%
- Min Volume: 1M
- EMA Aligned Only: Yes

**"Conservative Value Plays"**
- Min Score: 60
- Max Distance: 5%
- Min Market Cap: $1B
- Max P/E: 20
- Min ROE: 15%

**"Momentum Breakouts"**
- Min Score: 75
- Max Distance: 3%
- Min Relative Volume: 1.5
- Price Above EMA21: Yes
- Min Weekly Perf: 10%

## Future Enhancements

Potential features for future development:
- Public/shared presets that all users can access
- Preset categories or tags
- Import/export presets as JSON
- Preset versioning and history
- Preset templates for common strategies
