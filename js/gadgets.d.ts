/**
 * Zen Writer Gadgets API - TypeScript Type Definitions
 * @version 0.3.25
 * @description Type definitions for the Zen Writer Gadgets system
 */

/**
 * Gadget registration options
 */
interface GadgetOptions {
  /** Display title of the gadget */
  title?: string;
  /** Groups this gadget belongs to (e.g., 'structure', 'wiki', 'assist', 'settings') */
  groups?: string[];
  /** Icon identifier (Lucide icon name) */
  icon?: string;
  /** Whether this gadget should be enabled by default */
  defaultEnabled?: boolean;
  /** Custom CSS class for the gadget wrapper */
  className?: string;
  /** Whether this gadget can be detached to a floating panel */
  floatable?: boolean;
}

/**
 * Gadget factory function
 * @param container - The DOM element where the gadget should render
 * @param options - Optional configuration passed to the gadget
 */
type GadgetFactory = (container: HTMLElement, options?: Record<string, any>) => void;

/**
 * Gadget metadata
 */
interface GadgetMetadata {
  /** Unique identifier for the gadget */
  name: string;
  /** Display title */
  title: string;
  /** Groups this gadget belongs to */
  groups: string[];
  /** Factory function to create the gadget */
  factory: GadgetFactory;
  /** Icon identifier */
  icon?: string;
  /** Whether enabled by default */
  defaultEnabled: boolean;
  /** Custom CSS class */
  className?: string;
  /** Whether floatable */
  floatable: boolean;
}

/**
 * Loadout configuration
 */
interface LoadoutConfig {
  /** Unique identifier for the loadout */
  id: string;
  /** Display name */
  name: string;
  /** Description of the loadout */
  description?: string;
  /** Gadget configuration per group */
  groups: {
    [groupName: string]: string[];
  };
  /** Whether this is a built-in loadout */
  builtin?: boolean;
}

/**
 * Gadget preferences
 */
interface GadgetPreferences {
  /** Active loadout ID */
  activeLoadout?: string;
  /** Custom loadouts */
  customLoadouts?: LoadoutConfig[];
  /** Enabled gadgets per group */
  enabledGadgets?: {
    [groupName: string]: string[];
  };
  /** Gadget-specific settings */
  gadgetSettings?: {
    [gadgetName: string]: Record<string, any>;
  };
}

/**
 * Main Gadgets API
 */
interface ZWGadgets {
  /**
   * Register a new gadget
   * @param name - Unique identifier for the gadget
   * @param factory - Function that renders the gadget
   * @param options - Configuration options
   */
  register(name: string, factory: GadgetFactory, options?: GadgetOptions): void;

  /**
   * Initialize gadgets in a container
   * @param container - DOM element to render gadgets in
   * @param groupName - Group name to filter gadgets
   */
  init(container: HTMLElement, groupName?: string): void;

  /**
   * Get all registered gadgets
   * @returns Array of gadget metadata
   */
  getAll(): GadgetMetadata[];

  /**
   * Get gadgets for a specific group
   * @param groupName - Group name to filter by
   * @returns Array of gadget metadata
   */
  getByGroup(groupName: string): GadgetMetadata[];

  /**
   * Get a specific gadget by name
   * @param name - Gadget identifier
   * @returns Gadget metadata or undefined
   */
  get(name: string): GadgetMetadata | undefined;

  /**
   * Set the active group
   * @param groupName - Group to activate
   */
  setActiveGroup(groupName: string): void;

  /**
   * Get the current active group
   * @returns Active group name
   */
  getActiveGroup(): string;

  /**
   * Load gadget preferences
   * @returns Gadget preferences object
   */
  loadPrefs(): GadgetPreferences;

  /**
   * Save gadget preferences
   * @param prefs - Preferences to save
   */
  savePrefs(prefs: GadgetPreferences): void;

  /**
   * Apply a loadout
   * @param loadoutId - Loadout identifier
   */
  applyLoadout(loadoutId: string): void;

  /**
   * Get all available loadouts
   * @returns Array of loadout configurations
   */
  getLoadouts(): LoadoutConfig[];

  /**
   * Create a custom loadout
   * @param config - Loadout configuration
   */
  createLoadout(config: LoadoutConfig): void;

  /**
   * Delete a custom loadout
   * @param loadoutId - Loadout identifier
   */
  deleteLoadout(loadoutId: string): void;

  /**
   * Export gadget preferences
   * @returns JSON string of preferences
   */
  exportPrefs(): string;

  /**
   * Import gadget preferences
   * @param json - JSON string of preferences
   */
  importPrefs(json: string): void;
}

/**
 * Gadgets utility functions
 */
interface ZWGadgetsUtils {
  /**
   * Create a labeled input field
   * @param labelText - Label text
   * @param inputElement - Input element
   * @returns Container element
   */
  createLabeledInput(labelText: string, inputElement: HTMLElement): HTMLElement;

  /**
   * Create a section with title
   * @param title - Section title
   * @returns Section element
   */
  createSection(title: string): HTMLElement;

  /**
   * Create a button
   * @param text - Button text
   * @param onClick - Click handler
   * @param className - Optional CSS class
   * @returns Button element
   */
  createButton(text: string, onClick: () => void, className?: string): HTMLButtonElement;

  /**
   * Show a notification
   * @param message - Notification message
   * @param type - Notification type ('info', 'success', 'warning', 'error')
   * @param duration - Duration in milliseconds
   */
  showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number): void;
}

/**
 * Global declarations
 */
declare global {
  interface Window {
    /** Main Gadgets API */
    ZWGadgets: ZWGadgets;
    /** Gadgets utility functions */
    ZWGadgetsUtils: ZWGadgetsUtils;
  }
}

export {};
