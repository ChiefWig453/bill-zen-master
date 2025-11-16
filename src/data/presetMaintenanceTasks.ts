export interface PresetMaintenanceTask {
  name: string;
  description: string;
  frequency: 'weekly' | 'monthly' | 'seasonal';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  reminder_days_before: number;
}

export const presetMaintenanceTasks: PresetMaintenanceTask[] = [
  // Weekly Tasks
  {
    name: "Check HVAC Filters",
    description: "Inspect and replace air filters if needed for optimal air quality and system efficiency",
    frequency: "weekly",
    reminder_days_before: 3,
  },
  {
    name: "Test Smoke & CO Detectors",
    description: "Press test button on all smoke and carbon monoxide detectors",
    frequency: "weekly",
    reminder_days_before: 3,
  },
  {
    name: "Clean Kitchen Drains",
    description: "Run hot water and pour baking soda down drains to prevent clogs",
    frequency: "weekly",
    reminder_days_before: 3,
  },

  // Monthly Tasks
  {
    name: "Clean Gutters",
    description: "Remove leaves and debris from gutters and downspouts",
    frequency: "monthly",
    reminder_days_before: 5,
  },
  {
    name: "Inspect Plumbing",
    description: "Check for leaks under sinks, around toilets, and visible pipes",
    frequency: "monthly",
    reminder_days_before: 5,
  },
  {
    name: "Test Garage Door Safety Features",
    description: "Test auto-reverse mechanism and photo-eye sensors on garage door",
    frequency: "monthly",
    reminder_days_before: 5,
  },
  {
    name: "Clean Range Hood Filters",
    description: "Remove and clean or replace range hood filters",
    frequency: "monthly",
    reminder_days_before: 5,
  },
  {
    name: "Check Water Softener Salt",
    description: "Inspect and refill water softener salt levels if applicable",
    frequency: "monthly",
    reminder_days_before: 5,
  },
  {
    name: "Inspect Fire Extinguishers",
    description: "Check pressure gauge and ensure fire extinguishers are accessible",
    frequency: "monthly",
    reminder_days_before: 5,
  },

  // Spring Tasks
  {
    name: "Service HVAC System",
    description: "Schedule professional AC inspection and tune-up before summer",
    frequency: "seasonal",
    season: "spring",
    reminder_days_before: 14,
  },
  {
    name: "Clean Window Screens",
    description: "Remove, wash, and reinstall window screens",
    frequency: "seasonal",
    season: "spring",
    reminder_days_before: 7,
  },
  {
    name: "Inspect Roof",
    description: "Check for damaged or missing shingles after winter",
    frequency: "seasonal",
    season: "spring",
    reminder_days_before: 7,
  },
  {
    name: "Test Sump Pump",
    description: "Pour water into sump pump pit to ensure it activates properly",
    frequency: "seasonal",
    season: "spring",
    reminder_days_before: 7,
  },
  {
    name: "Check Outdoor Faucets",
    description: "Turn on outdoor water and check for leaks or freeze damage",
    frequency: "seasonal",
    season: "spring",
    reminder_days_before: 7,
  },

  // Summer Tasks
  {
    name: "Power Wash Exterior",
    description: "Clean siding, deck, and driveway with power washer",
    frequency: "seasonal",
    season: "summer",
    reminder_days_before: 7,
  },
  {
    name: "Seal Deck/Fence",
    description: "Apply weatherproof sealant to wooden deck and fence",
    frequency: "seasonal",
    season: "summer",
    reminder_days_before: 14,
  },
  {
    name: "Clean Dryer Vent",
    description: "Disconnect and thoroughly clean dryer vent to prevent fire hazard",
    frequency: "seasonal",
    season: "summer",
    reminder_days_before: 7,
  },
  {
    name: "Inspect Sprinkler System",
    description: "Check all sprinkler heads and adjust for proper coverage",
    frequency: "seasonal",
    season: "summer",
    reminder_days_before: 7,
  },

  // Fall Tasks
  {
    name: "Service Heating System",
    description: "Schedule professional furnace inspection and tune-up before winter",
    frequency: "seasonal",
    season: "fall",
    reminder_days_before: 14,
  },
  {
    name: "Winterize Outdoor Faucets",
    description: "Drain and shut off outdoor water lines to prevent freezing",
    frequency: "seasonal",
    season: "fall",
    reminder_days_before: 7,
  },
  {
    name: "Clean Chimney/Fireplace",
    description: "Have chimney professionally cleaned and inspected",
    frequency: "seasonal",
    season: "fall",
    reminder_days_before: 14,
  },
  {
    name: "Reverse Ceiling Fans",
    description: "Switch ceiling fan direction to clockwise for winter",
    frequency: "seasonal",
    season: "fall",
    reminder_days_before: 7,
  },
  {
    name: "Check Weather Stripping",
    description: "Inspect and replace weather stripping around doors and windows",
    frequency: "seasonal",
    season: "fall",
    reminder_days_before: 7,
  },

  // Winter Tasks
  {
    name: "Check Attic Insulation",
    description: "Inspect attic insulation and ventilation for energy efficiency",
    frequency: "seasonal",
    season: "winter",
    reminder_days_before: 7,
  },
  {
    name: "Test Generator",
    description: "Run backup generator and check oil/fuel levels",
    frequency: "seasonal",
    season: "winter",
    reminder_days_before: 7,
  },
  {
    name: "Inspect Indoor Air Quality",
    description: "Check humidifier levels and consider air purifier filter replacement",
    frequency: "seasonal",
    season: "winter",
    reminder_days_before: 7,
  },
  {
    name: "Check for Ice Dams",
    description: "Inspect roof for ice dam formation and address if necessary",
    frequency: "seasonal",
    season: "winter",
    reminder_days_before: 7,
  },
];
