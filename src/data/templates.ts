import { DecisionTemplate } from '../types/decision';

export const PRESET_TEMPLATES: DecisionTemplate[] = [
  {
    id: 'job-offers',
    title: 'Job Offer Comparison',
    description: 'Evaluate multiple job offers balancing salary, remote flexibility, growth, and work-life balance.',
    category: 'career',
    icon: 'Briefcase',
    options: [
      { name: 'TechCorp Senior Role', color: '#6366f1', description: 'Established Enterprise, high pay, hybrid' },
      { name: 'Startup Lead Engineer', color: '#10b981', description: 'Early-stage Startup, equity, high autonomy' },
      { name: 'Remote Global Agency', color: '#06b6d4', description: '100% Remote, flexible hours, stable salary' }
    ],
    criteria: [
      { name: 'Base Compensation & Benefits', weight: 9, isPositive: true, description: 'Salary, bonus, healthcare, 401k match' },
      { name: 'Work-Life Balance & Hours', weight: 8, isPositive: true, description: 'Expected weekly workload and stress' },
      { name: 'Career Growth & Learning', weight: 8, isPositive: true, description: 'Mentorship, promotion velocity, skills gained' },
      { name: 'Remote Flexibility / Commute', weight: 7, isPositive: true, description: 'Days WFH vs office commute time' },
      { name: 'Company Culture & Stability', weight: 6, isPositive: true, description: 'Financial runway, team dynamics' }
    ],
    defaultScores: {
      'opt0_crit0': 9, 'opt0_crit1': 6, 'opt0_crit2': 7, 'opt0_crit3': 5, 'opt0_crit4': 9,
      'opt1_crit0': 7, 'opt1_crit1': 5, 'opt1_crit2': 9, 'opt1_crit3': 8, 'opt1_crit4': 6,
      'opt2_crit0': 8, 'opt2_crit1': 9, 'opt2_crit2': 6, 'opt2_crit3': 10, 'opt2_crit4': 8
    }
  },
  {
    id: 'home-buying',
    title: 'Apartment / House Selection',
    description: 'Weigh price, location, neighborhood quality, and space across prospective homes.',
    category: 'housing',
    icon: 'Home',
    options: [
      { name: 'Downtown High-rise Condo', color: '#6366f1', description: 'Walking distance to city center, compact space' },
      { name: 'Suburban Single Family', color: '#10b981', description: 'Large yard, quiet neighborhood, longer commute' },
      { name: 'Midtown Modern Townhouse', color: '#f59e0b', description: 'Balanced location with medium yard' }
    ],
    criteria: [
      { name: 'Monthly Price / Mortgage', weight: 10, isPositive: false, description: 'Cost per month (lower score = higher cost, or negative factor)' },
      { name: 'Neighborhood & Safety', weight: 9, isPositive: true, description: 'Crime rates, school districts, walkable spots' },
      { name: 'Square Footage & Layout', weight: 7, isPositive: true, description: 'Bedrooms, bathrooms, yard space' },
      { name: 'Commute Time to Work', weight: 8, isPositive: false, description: 'Daily travel time' },
      { name: 'Move-in Condition', weight: 5, isPositive: true, description: 'Renovations required vs turn-key' }
    ],
    defaultScores: {
      'opt0_crit0': 4, 'opt0_crit1': 9, 'opt0_crit2': 5, 'opt0_crit3': 9, 'opt0_crit4': 9,
      'opt1_crit0': 8, 'opt1_crit1': 9, 'opt1_crit2': 10, 'opt1_crit3': 4, 'opt1_crit4': 7,
      'opt2_crit0': 6, 'opt2_crit1': 8, 'opt2_crit2': 7, 'opt2_crit3': 7, 'opt2_crit4': 8
    }
  },
  {
    id: 'tech-stack',
    title: 'Framework / Tech Stack Choice',
    description: 'Compare software tools or frameworks based on speed, developer experience, and ecosystem.',
    category: 'tech',
    icon: 'Code',
    options: [
      { name: 'React + Express', color: '#06b6d4', description: 'Traditional, mature, huge ecosystem' },
      { name: 'Next.js App Router', color: '#8b5cf6', description: 'Fullstack React framework, SSR & Edge' },
      { name: 'Vite React + Supabase', color: '#10b981', description: 'Ultra-fast SPA build with Serverless DB' }
    ],
    criteria: [
      { name: 'Development Speed & Velocity', weight: 9, isPositive: true, description: 'Time to prototype and launch' },
      { name: 'Ecosystem & Documentation', weight: 8, isPositive: true, description: 'Community support, packages, guides' },
      { name: 'Performance & Bundle Size', weight: 7, isPositive: true, description: 'Lighthouse score, load speed' },
      { name: 'Deployment Simplicity', weight: 8, isPositive: true, description: 'Hosting overhead, CI/CD ease' },
      { name: 'Learning Curve for Team', weight: 6, isPositive: true, description: 'Ease of adoption' }
    ],
    defaultScores: {
      'opt0_crit0': 7, 'opt0_crit1': 10, 'opt0_crit2': 7, 'opt0_crit3': 7, 'opt0_crit4': 9,
      'opt1_crit0': 8, 'opt1_crit1': 9, 'opt1_crit2': 8, 'opt1_crit3': 9, 'opt1_crit4': 6,
      'opt2_crit0': 10, 'opt2_crit1': 8, 'opt2_crit2': 9, 'opt2_crit3': 10, 'opt2_crit4': 8
    }
  },
  {
    id: 'vacation-destination',
    title: 'Vacation Spot Selector',
    description: 'Decide where to travel by comparing budget, activities, travel time, and weather.',
    category: 'travel',
    icon: 'Palmtree',
    options: [
      { name: 'Tropical Beach Resort', color: '#06b6d4', description: 'Relaxation, warm weather, water sports' },
      { name: 'Historic European City', color: '#f43f5e', description: 'Museums, architecture, food tour' },
      { name: 'Mountain Cabin Getaway', color: '#10b981', description: 'Hiking, nature, quiet retreat' }
    ],
    criteria: [
      { name: 'Total Travel Cost', weight: 9, isPositive: false, description: 'Flights, hotel, daily expenses' },
      { name: 'Activities & Attractions', weight: 8, isPositive: true, description: 'Things to see and do' },
      { name: 'Travel Effort & Time', weight: 6, isPositive: false, description: 'Flight durations and transfers' },
      { name: 'Relaxation & Comfort', weight: 8, isPositive: true, description: 'Unwinding potential' },
      { name: 'Weather / Climate', weight: 7, isPositive: true, description: 'Ideal temperature during travel dates' }
    ],
    defaultScores: {
      'opt0_crit0': 6, 'opt0_crit1': 8, 'opt0_crit2': 7, 'opt0_crit3': 10, 'opt0_crit4': 9,
      'opt1_crit0': 4, 'opt1_crit1': 10, 'opt1_crit2': 4, 'opt1_crit3': 6, 'opt1_crit4': 7,
      'opt2_crit0': 8, 'opt2_crit1': 7, 'opt2_crit2': 8, 'opt2_crit3': 9, 'opt2_crit4': 8
    }
  }
];
