/**
 * CoolShiftDashboard UI Injection & Controller Module
 * Automatically discovers layout anchors, injects a region selection UI,
 * and handles data integration hooks for automated multi-region simulation.
 */

(function () {
    // 1. Define the regional database to populate dropdown metadata dynamically
    const REGIONS = [
        { id: "iit_delhi_brpl", name: "IIT Delhi Campus (BSES Rajdhani)" },
        { id: "delhi_tata_power", name: "North Delhi Area (Tata Power DDL)" },
        { id: "mumbai_best", name: "Mumbai Commercial (BEST Tariff)" }
    ];

    // Current state tracks
    let activeRegion = "iit_delhi_brpl";
    let activeMonth = new Date().getMonth() + 1; // Default to current calendar month
    let activeHour = 12; // Default to noon grid cycle

    // 2. Initialize UI Component Injection
    function initCoolShiftUI() {
        // Attempt to find user anchor or fallback directly to #bm section
        let container = document.getElementById("coolshift-selector-container");
        if (!container) {
            const bmSection = document.getElementById("bm") || document.querySelector(".grid") || document.body;
            container = document.createElement("div");
            container.id = "coolshift-selector-container";
            // Insert at the top of target zone
            bmSection.insertBefore(container, bmSection.firstChild);
        }

        // Apply clean modern dashboard inline styling
        container.style.margin = "15px 0";
        container.style.padding = "10px";
        container.style.background = "rgba(255, 255, 255, 0.05)";
        container.style.borderRadius = "6px";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "10px";

        // Create Dropdown Label
        const label = document.createElement("label");
        label.htmlFor = "coolshift-region-select";
        label.innerText = "Automated Region Selector:";
        label.style.fontWeight = "bold";
        label.style.fontSize = "14px";

        // Create Select Dropdown Element
        const select = document.createElement("select");
        select.id = "coolshift-region-select";
        select.style.padding = "6px 12px";
        select.style.borderRadius = "4px";
        select.style.border = "1px solid #444";
        select.style.background = "#222";
        select.style.color = "#fff";
        select.style.cursor = "pointer";

        // Populate options loop
        REGIONS.forEach(reg => {
            const opt = document.createElement("option");
            opt.value = reg.id;
            opt.innerText = reg.name;
            select.appendChild(opt);
        });

        container.appendChild(label);
        container.appendChild(select);

        // Bind runtime event listener change event
        select.addEventListener("change", (e) => {
            activeRegion = e.target.value;
            triggerDashboardRecalculation();
        });

        // Run initial pipeline loop execution
        triggerDashboardRecalculation();
    }

    // 3. Central Processing Pipeline Hook
    function triggerDashboardRecalculation() {
        // Safe validation fallback checking if core calculation framework exists
        if (typeof calculateDynamicRetroShift === "function") {
            const payload = calculateDynamicRetroShift(activeRegion, activeMonth, activeHour);
            updateDashboardMetrics(payload);
        } else {
            console.warn("CoolShift warning: calculateDynamicRetroShift function not found yet. Ensure retro-shift.js is loaded first.");
        }
    }

    // 4. Update DOM Nodes / Visual Charts Placeholder
    function updateDashboardMetrics(payload) {
        console.log("CoolShift automated shift trigger processed:", payload);
        
        // Custom Hook: If your project dashboard has existing metric cards or graph frames,
        // you can drop your custom redraw scripts right inside this function.
        const statusNode = document.getElementById("coolshift-status-display");
        if (statusNode) {
            statusNode.innerText = `Region Alert: ${payload.financialImpactDelta.status} (${(payload.financialImpactDelta.gap * 100).toFixed(1)}% Gap)`;
            statusNode.style.color = payload.financialImpactDelta.color;
        }
    }

    // Wait safely for DOM parsing to finish execution before injection loop triggers
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initCoolShiftUI);
    } else {
        initCoolShiftUI();
    }
})();
