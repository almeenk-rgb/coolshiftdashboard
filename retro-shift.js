/**
 * Regional Tariff Retro-Shift Mechanism
 * Automates Time-of-Day (ToD) tariff translation from MSEDCL baselines 
 * to real-time regional rules (Delhi DERC/BSES, Tata Power, etc.)
 */

// Comprehensive multi-region tariff matrix
const REGIONAL_TARIFFS = {
    "iit_delhi_brpl": {
        name: "IIT Delhi (BSES Rajdhani - Demand > 10kW)",
        getTariff: (month, hour) => {
            const isSummerPeak = [5, 6, 7, 8, 9].includes(month); // May - Sept
            let zone = "Delhi Base Normal";
            let modifier = 0.00;
            let label = "Standard Base Rate";

            if (hour >= 10 && hour < 16) {
                zone = "Delhi Solar Hour";
                modifier = -0.15; // 15% Solar Discount
                label = "Solar Generation Incentive";
            } else if ((hour >= 0.5 && hour < 6)) {
                zone = "Delhi Night Off-Peak";
                modifier = -0.15; // 15% Night Off-Peak Discount
                label = "Night Off-Peak Rebate";
            } else if (isSummerPeak && ((hour >= 14 && hour < 17) || (hour >= 18.5 && hour < 24) || (hour >= 0 && hour < 0.5))) {
                zone = "Delhi Summer Peak Surge";
                modifier = 0.20; // 20% Peak Surcharge
                label = "Critical Summer Grid Load Surcharge";
            }
            return { zone, modifier, label };
        }
    },
    "delhi_tata_power": {
        name: "North Delhi (Tata Power DDL - C&I)",
        getTariff: (month, hour) => {
            const isSummerPeak = [5, 6, 7, 8, 9].includes(month);
            let zone = "TPDDL Base";
            let modifier = 0.00;
            let label = "Standard Rate";

            if (hour >= 10 && hour < 16) {
                zone = "TPDDL Solar Window";
                modifier = -0.20; 
                label = "Solar Rebate";
            } else if (isSummerPeak && ((hour >= 13 && hour < 17) || (hour >= 19 && hour < 23))) {
                zone = "TPDDL Peak Hours";
                modifier = 0.25; 
                label = "Peak Grid Demand Charge";
            } else if (hour >= 23 || hour < 6) {
                zone = "TPDDL Off-Peak Night";
                modifier = -0.10;
                label = "Night Off-Peak Concession";
            }
            return { zone, modifier, label };
        }
    },
    "mumbai_best": {
        name: "Mumbai City (BEST - Commercial)",
        getTariff: (month, hour) => {
            let zone = "BEST Base Day";
            let modifier = 0.00;
            let label = "Standard Rate";

            if (hour >= 22 || hour < 6) {
                zone = "BEST Night Off-Peak";
                modifier = -0.25; // Continuous industrial/commercial night incentive
                label = "Night Concession";
            } else if ((hour >= 9 && hour < 12) || (hour >= 18 && hour < 22)) {
                zone = "BEST Peak Window";
                modifier = 0.20;
                label = "Peak Surcharge";
            }
            return { zone, modifier, label };
        }
    }
};

/**
 * Core Shift Engine
 * Evaluates the baseline unautomated MSEDCL framework against the target region dynamically.
 * 
 * @param {string} regionKey - Key identifier matching REGIONAL_TARIFFS entries
 * @param {number} month - Calendar Month (1 = January, 12 = December)
 * @param {number} hour - Float or Integer hour window (0.00 to 23.99)
 * @returns {Object} Comprehensive delta analysis packet for dashboard ingestion
 */
function calculateDynamicRetroShift(regionKey, month, hour) {
    // 1. Establish the fallback unautomated legacy assumption (MSEDCL Baseline Rules)
    let msedclZone = "MSEDCL Base/Shoulder";
    let msedclModifier = 0.00;
    let msedclLabel = "Standard Baseline Rate";

    if (hour >= 9 && hour < 17) {
        msedclZone = "MSEDCL Solar Window";
        msedclModifier = -0.20; // Static 20% daytime solar zone concession
        msedclLabel = "Daytime Solar Rebate";
    } else if (hour >= 17 && hour < 24) {
        msedclZone = "MSEDCL Evening Peak";
        msedclModifier = 0.20;  // Static 20% evening peak surcharge
        msedclLabel = "Evening Demand Surcharge";
    } else if (hour >= 0 && hour < 6) {
        msedclZone = "MSEDCL Night Off-Peak";
        msedclModifier = -0.10; // Static 10% deep-night concession
        msedclLabel = "Night Off-Peak Rebate";
    }

    // 2. Fetch the target automation profile dynamically without disturbing existing scripts
    const activeRegion = REGIONAL_TARIFFS[regionKey] || REGIONAL_TARIFFS["iit_delhi_brpl"];
    const targetBilling = activeRegion.getTariff(month, hour);

    // 3. Compute structural divergence parameters
    const tariffMismatchGap = targetBilling.modifier - msedclModifier;

    return {
        selectedRegionName: activeRegion.name,
        timestampProfile: { month, hour },
        msedclBaseline: {
            zone: msedclZone,
            modifier: msedclModifier,
            label: msedclLabel
        },
        automatedTarget: {
            zone: targetBilling.zone,
            modifier: targetBilling.modifier,
            label: targetBilling.label
        },
        financialImpactDelta: {
            mismatchGap: tariffMismatchGap,
            status: tariffMismatchGap > 0 ? "Underbilling Risk" : (tariffMismatchGap < 0 ? "Overbilling Buffer" : "Aligned"),
            cssColorClass: tariffMismatchGap > 0 ? "text-danger" : (tariffMismatchGap < 0 ? "text-success" : "text-muted")
        }
    };
}

// Global exposure for immediate pipeline attachment
window.calculateDynamicRetroShift = calculateDynamicRetroShift;
window.AVAILABLE_TARIFF_REGIONS = Object.keys(REGIONAL_TARIFFS).map(key => ({ key, name: REGIONAL_TARIFFS[key].name }));