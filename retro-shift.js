/**
 * Dynamic Multi-Region Tariff Translation Engine
 * Automatically maps standard MSEDCL inputs to localized grid frameworks
 */

const REGIONAL_TARIFFS = {
    iit_delhi_brpl: {
        name: "IIT Delhi (BSES Rajdhani)",
        getModifier: (month, hour) => {
            const isSummer = [5, 6, 7, 8, 9].includes(month); // May - Sept
            if (hour >= 10 && hour < 16) return { zone: "Delhi Solar Hour", modifier: -0.15 };
            if (hour >= 0.5 && hour < 6) return { zone: "Delhi Night Off-Peak", modifier: -0.15 };
            if (isSummer && ((hour >= 14 && hour < 17) || (hour >= 18.5 && hour < 24.5) || (hour >= 0 && hour < 0.5))) {
                return { zone: "Delhi Summer Peak Surge", modifier: 0.20 };
            }
            return { zone: "Delhi Base/Normal", modifier: 0.00 };
        }
    },
    delhi_tata_power: {
        name: "North Delhi Area (Tata Power DDL)",
        getModifier: (month, hour) => {
            const isSummer = [5, 6, 7, 8, 9].includes(month); // May - Sept
            if (hour >= 10 && hour < 16) return { zone: "TPDDL Solar Window", modifier: -0.20 };
            if (hour >= 0 && hour < 5) return { zone: "TPDDL Night Off-Peak", modifier: -0.10 };
            if (isSummer && (hour >= 13 && hour < 17)) return { zone: "TPDDL Peak Hours", modifier: 0.15 };
            return { zone: "TPDDL Standard Normal", modifier: 0.00 };
        }
    },
    mumbai_best: {
        name: "Mumbai Commercial (BEST Tariff)",
        getModifier: (month, hour) => {
            if (hour >= 9 && hour < 16) return { zone: "BEST Solar Concession", modifier: -0.20 };
            if (hour >= 16 && hour < 22) return { zone: "BEST Evening Peak", modifier: 0.20 };
            return { zone: "BEST Normal Hours", modifier: 0.00 };
        }
    }
};

function calculateDynamicRetroShift(regionId, month, hour) {
    // 1. Core MSEDCL baseline calculation
    let msedclZone = "Base/Shoulder";
    let msedclModifier = 0.00;
    if (hour >= 9 && hour < 17) { msedclZone = "Solar/Off-Peak"; msedclModifier = -0.20; }
    else if (hour >= 17 && hour < 24) { msedclZone = "Evening Peak"; msedclModifier = 0.20; }
    else if (hour >= 0 && hour < 6) { msedclZone = "Night Off-Peak"; msedclModifier = -0.10; }

    // 2. Fetch active automated target rules
    const targetRegion = REGIONAL_TARIFFS[regionId] || REGIONAL_TARIFFS["iit_delhi_brpl"];
    const targetData = targetRegion.getModifier(month, hour);

    const gap = targetData.modifier - msedclModifier;
    let status = "Balanced Grid Match";
    let color = "#4CAF50";

    if (gap > 0) { status = "Underbilling Risk"; color = "#FF5252"; }
    else if (gap < 0) { status = "Overbilling Protection"; color = "#FFD700"; }

    return {
        msedcl: { zone: msedclZone, modifier: msedclModifier },
        automatedTarget: { region: targetRegion.name, zone: targetData.zone, modifier: targetData.modifier },
        financialImpactDelta: { gap: gap, status: status, color: color }
    };
}
