# Database Schema Documentation

## Overview
This schema manages a cat feeding and weight tracking application. It enforces household-based access control, tracks feeding schedules, and monitors cat weight progress through goals and milestones.

## Abbreviations
- **PK**: Primary Key
- **FK**: Foreign Key (links to another table)
- **NN**: Not Null (required field)
- **UQ**: Unique (no duplicates allowed)
- **TS**: Timestamp with timezone (TIMESTAMPTZ)
- **UUID**: Universally Unique Identifier

## Tables

### `cats`
- **Description**: Stores cat information and their basic attributes.
- **Columns**:

| Column      | Type          | Constraints | Description                    |
|-------------|---------------|-------------|--------------------------------|
| id          | UUID          | PK, NN      | Unique identifier             |
| created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
| updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
| name        | TEXT          | NN          | Cat's name                    |
| birth_date  | DATE          |             | Cat's birth date              |
| weight      | DECIMAL(5,2)  |             | Current weight                |
| household_id| UUID          | FK, NN      | Associated household          |
| owner_id    | UUID          | FK, NN      | Cat's owner profile          |

- **Relationships**:
  - References `households(id)` via `household_id`
  - References `profiles(id)` via `owner_id`
  - Referenced by `feeding_logs(cat_id)`
  - Referenced by `schedules(cat_id)`
  - Referenced by `cat_weight_logs(cat_id)`
  - Referenced by `weight_goals(cat_id)`

### `households`
- **Description**: Represents household units that group cats and members.
- **Columns**:

| Column      | Type          | Constraints | Description                    |
|-------------|---------------|-------------|--------------------------------|
| id          | UUID          | PK, NN      | Unique identifier             |
| created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
| updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
| name        | TEXT          | NN          | Household name                |
| description | TEXT          |             | Optional description          |
| owner_id    | UUID          | FK, NN      | Household owner's ID          |

- **Relationships**:
  - Referenced by `cats(household_id)`
  - Referenced by `household_members(household_id)`
  - Referenced by `feeding_logs(household_id)`

### `profiles`
- **Description**: Stores user profile information, linked to Supabase auth.
- **Columns**:

| Column      | Type          | Constraints | Description                    |
|-------------|---------------|-------------|--------------------------------|
| id          | UUID          | PK, NN      | Matches Supabase auth.user.id |
| updated_at  | TIMESTAMPTZ   | TS          | Last update timestamp         |
| username    | TEXT          | UQ          | Unique username               |
| full_name   | TEXT          |             | User's full name              |
| avatar_url  | TEXT          |             | Profile picture URL           |
| email       | TEXT          |             | User's email address          |

- **Relationships**:
  - Referenced by `cats(owner_id)`
  - Referenced by `household_members(user_id)`
  - Referenced by `feeding_logs(fed_by)`
  - Referenced by `cat_weight_logs(measured_by)`
  - Referenced by `weight_goals(created_by)`

### `household_members`
- **Description**: Maps users to households with roles.
- **Columns**:

| Column      | Type          | Constraints | Description                    |
|-------------|---------------|-------------|--------------------------------|
| id          | UUID          | PK, NN      | Unique identifier             |
| household_id| UUID          | FK, NN      | Associated household          |
| user_id     | UUID          | FK, NN      | Associated user profile       |
| role        | TEXT          | NN          | Member's role in household    |
| created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |

- **Relationships**:
  - References `households(id)` via `household_id`
  - References `profiles(id)` via `user_id`
  - Unique constraint on `[household_id, user_id]`

### `feeding_logs`
- **Description**: Records individual feeding events for cats.
- **Columns**:

| Column      | Type          | Constraints | Description                    |
|-------------|---------------|-------------|--------------------------------|
| id          | UUID          | PK, NN      | Unique identifier             |
| created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
| updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
| cat_id      | UUID          | FK, NN      | Fed cat's ID                  |
| household_id| UUID          | FK, NN      | Associated household          |
| meal_type   | TEXT          | NN          | Type of meal                  |
| amount      | DECIMAL(5,2)  | NN          | Amount of food                |
| unit        | TEXT          | NN          | Unit of measurement           |
| notes       | TEXT          |             | Optional notes                |
| fed_by      | UUID          | FK          | User who fed the cat          |
| fed_at      | TIMESTAMPTZ   | NN          | When feeding occurred         |

- **Relationships**:
  - References `cats(id)` via `cat_id`
  - References `profiles(id)` via `fed_by`
  - References `households(id)` via `household_id`

### `schedules`
- **Description**: Defines feeding schedules for cats.
- **Columns**:

| Column      | Type          | Constraints | Description                    |
|-------------|---------------|-------------|--------------------------------|
| id          | UUID          | PK, NN      | Unique identifier             |
| cat_id      | UUID          | FK, NN      | Associated cat                |
| type        | TEXT          | NN          | Schedule type                 |
| interval    | INTEGER       |             | Hours between feedings        |
| times       | TEXT[]        | NN          | Array of feeding times        |
| enabled     | BOOLEAN       | NN          | Schedule active status        |
| created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
| updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |

- **Relationships**:
  - References `cats(id)` via `cat_id` with CASCADE delete

### `cat_weight_logs`
- **Description**: Tracks cat weight measurements over time.
- **Columns**:

| Column      | Type          | Constraints | Description                    |
|-------------|---------------|-------------|--------------------------------|
| id          | UUID          | PK, NN      | Unique identifier             |
| created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
| updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
| weight      | DECIMAL(5,2)  | NN          | Measured weight               |
| date        | DATE          | NN          | Measurement date              |
| cat_id      | UUID          | FK, NN      | Associated cat                |
| notes       | TEXT          |             | Optional notes                |
| measured_by | UUID          | FK          | User who took measurement     |

- **Relationships**:
  - References `cats(id)` via `cat_id` with CASCADE delete
  - References `profiles(id)` via `measured_by`

### `weight_goals`
- **Description**: Defines weight goals for cats.
- **Columns**:

| Column        | Type          | Constraints | Description                    |
|---------------|---------------|-------------|--------------------------------|
| id            | UUID          | PK, NN      | Unique identifier             |
| created_at    | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
| updated_at    | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
| cat_id        | UUID          | FK, NN      | Associated cat                |
| target_weight | DECIMAL(5,2)  | NN          | Goal weight                   |
| target_date   | DATE          |             | Target achievement date       |
| start_weight  | DECIMAL(5,2)  |             | Starting weight               |
| status        | TEXT          | NN          | Goal status                   |
| notes         | TEXT          |             | Optional notes                |
| created_by    | UUID          | FK, NN      | User who created goal         |

- **Relationships**:
  - References `cats(id)` via `cat_id` with CASCADE delete
  - References `profiles(id)` via `created_by`
  - Referenced by `weight_goal_milestones(goal_id)`

### `weight_goal_milestones`
- **Description**: Tracks progress milestones for weight goals.
- **Columns**:

| Column      | Type          | Constraints | Description                    |
|-------------|---------------|-------------|--------------------------------|
| id          | UUID          | PK, NN      | Unique identifier             |
| created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
| goal_id     | UUID          | FK, NN      | Associated weight goal        |
| weight      | DECIMAL(5,2)  | NN          | Milestone weight              |
| date        | DATE          | NN          | Target date                   |
| notes       | TEXT          |             | Optional notes                |

- **Relationships**:
  - References `weight_goals(id)` via `goal_id` with CASCADE delete

## Example Data
```json
{
  "households": [{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Smith Family",
    "owner_id": "a67e23d0-e29b-41d4-a716-446655440000"
  }],
  "profiles": [{
    "id": "a67e23d0-e29b-41d4-a716-446655440000",
    "username": "jsmith",
    "full_name": "John Smith"
  }],
  "cats": [{
    "id": "b12c4a80-e29b-41d4-a716-446655440000",
    "name": "Whiskers",
    "household_id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_id": "a67e23d0-e29b-41d4-a716-446655440000"
  }],
  "feeding_logs": [{
    "id": "c98f2340-e29b-41d4-a716-446655440000",
    "cat_id": "b12c4a80-e29b-41d4-a716-446655440000",
    "meal_type": "breakfast",
    "amount": 100.00,
    "unit": "g",
    "fed_at": "2024-03-14T08:00:00Z"
  }]
}
```

## Key Constraints
- All UUIDs must be valid version 4 UUIDs
- `profiles.id` must match a valid Supabase auth.users.id
- `household_members` enforces unique user per household
- `weight_goals.status` must be one of predefined status values
- Decimal fields use 5 digits with 2 decimal places
- All timestamps are stored in UTC (timestamptz)
- Cascading deletes are enabled for weight-related tables 