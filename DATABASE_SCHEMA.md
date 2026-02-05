# Lesson Database Schema

The application uses a client-side JSON structure to simulate a database.

## `Lesson` Object
Represents a course or recurring lesson group.

```json
{
  "id": "string (UUID or short code)",
  "title": "string (e.g., 'Conversation Club')",
  "type": "string ('group', 'private', 'conversation')",
  "teacher": "string",
  "studentCount": "number",
  "color": "string (hex code or class name)",
  "schedule": [
    {
        "day": "string (Monday, Tuesday, ...)",
        "startTime": "string (HH:MM 24h format)",
        "duration": "number (minutes)"
    }
  ]
}
```

## Example Data
```json
[
  {
    "id": "L001",
    "title": "Conversation Club",
    "type": "conversation",
    "studentCount": 4,
    "teacher": "Oruj Nasrullayev",
    "color": "#2563eb",
    "schedule": [
      { "day": "Wednesday", "startTime": "21:00", "duration": 90 },
      { "day": "Saturday", "startTime": "20:00", "duration": 90 },
      { "day": "Sunday", "startTime": "20:00", "duration": 90 }
    ]
  }
]
```