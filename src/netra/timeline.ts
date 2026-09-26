import type { NetraIdentity } from './identity.js';

export interface NetraTimelineEvent {
  id: string;
  date: string;
  type:
    | 'BIRTH'
    | 'EDUCATION'
    | 'EMPLOYMENT'
    | 'LOCATION'
    | 'FAMILY'
    | 'LIFE_EVENT';
  title: string;
  description: string;
  confidence: number;
}

export interface NetraTimeline {
  netraId: string;
  events: NetraTimelineEvent[];
}

function readString(
  value: unknown,
  fallback = 'UNKNOWN',
): string {
  return typeof value === 'string' && value.length > 0
    ? value
    : fallback;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function createTimeline(
  identity: NetraIdentity,
): NetraTimeline {
  const profile =
    identity.profile as unknown as Record<string, unknown>;

  const events: NetraTimelineEvent[] = [];

  const dateOfBirth = readString(
    profile.dateOfBirth ?? profile.dob,
  );

  events.push({
    id: `${identity.netraId}-BIRTH`,
    date: dateOfBirth,
    type: 'BIRTH',
    title: 'Birth',
    description: `Subject recorded as born on ${dateOfBirth}.`,
    confidence: 0.95,
  });

  const education = readArray(
    profile.education ??
      profile.educationalHistory,
  );

  education.forEach((item, index) => {
    if (typeof item === 'object' && item !== null) {
      const data = item as Record<string, unknown>;

      events.push({
        id: `${identity.netraId}-EDU-${index + 1}`,
        date: readString(
          data.graduationDate ??
            data.endDate ??
            data.year,
        ),
        type: 'EDUCATION',
        title: readString(
          data.degree ??
            data.qualification ??
            data.institution,
          'Education Record',
        ),
        description: readString(
          data.institution ??
            data.school ??
            data.university,
          'Education record associated with subject.',
        ),
        confidence: 0.9,
      });
    }
  });

  const employment = readArray(
    profile.employment ??
      profile.employmentHistory,
  );

  employment.forEach((item, index) => {
    if (typeof item === 'object' && item !== null) {
      const data = item as Record<string, unknown>;

      events.push({
        id: `${identity.netraId}-EMP-${index + 1}`,
        date: readString(
          data.startDate ??
            data.year,
        ),
        type: 'EMPLOYMENT',
        title: readString(
          data.position ??
            data.title ??
            data.occupation,
          'Employment Record',
        ),
        description: readString(
          data.employer ??
            data.company,
          'Employment record associated with subject.',
        ),
        confidence: 0.9,
      });
    }
  });

  const location = readString(
    profile.city ??
      profile.district ??
      profile.state,
  );

  events.push({
    id: `${identity.netraId}-LOCATION-CURRENT`,
    date: 'CURRENT',
    type: 'LOCATION',
    title: 'Current Location',
    description: `Recorded location: ${location}.`,
    confidence: 0.9,
  });

  return {
    netraId: identity.netraId,
    events,
  };
}