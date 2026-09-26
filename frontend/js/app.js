/* =========================================================
   STOCKSENSE APPLICATION
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const sidebar =
    document.getElementById("sidebar");

const mobileMenu =
    document.getElementById("mobileMenu");

const operationModal =
    document.getElementById("operationModal");

const newOperationButton =
    document.getElementById("newOperationButton");

const closeModal =
    document.getElementById("closeModal");

const resetFilters =
    document.getElementById("resetFilters");

const themeButton =
    document.getElementById("themeButton");

const notificationButton =
    document.getElementById("notificationButton");

const globalSearch =
    document.getElementById("globalSearch");


/* =========================================================
   SIDEBAR MOBILE MENU
   ========================================================= */

if (mobileMenu) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle("open");

        }
    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

const navigationItems =
    document.querySelectorAll(".nav-item");


navigationItems.forEach(
    (item) => {

        item.addEventListener(
            "click",
            () => {

                navigationItems.forEach(
                    (nav) => {

                        nav.classList.remove("active");

                    }
                );


                item.classList.add("active");


                const page =
                    item.dataset.page;


                console.log(
                    "Current page:",
                    page
                );


                if (window.innerWidth <= 800) {

                    sidebar.classList.remove("open");

                }

            }
        );

    }
);


/* =========================================================
   NEW OPERATION MODAL
   ========================================================= */

if (newOperationButton) {

    newOperationButton.addEventListener(
        "click",
        () => {

            operationModal.classList.add("show");

        }
    );

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

if (closeModal) {

    closeModal.addEventListener(
        "click",
        () => {

            operationModal.classList.remove("show");

        }
    );

}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
   ========================================================= */

if (operationModal) {

    operationModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                operationModal
            ) {

                operationModal.classList.remove(
                    "show"
                );

            }

        }
    );

}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            operationModal.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================================
   RESET FILTERS
   ========================================================= */

if (resetFilters) {

    resetFilters.addEventListener(
        "click",
        () => {

            const filters =
                document.querySelectorAll(
                    ".filter-select"
                );


            filters.forEach(
                (filter) => {

                    filter.selectedIndex = 0;

                }
            );

        }
    );

}


/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

if (globalSearch) {

    globalSearch.addEventListener(
        "input",
        (event) => {

            const searchText =
                event.target.value
                    .toLowerCase()
                    .trim();


            const rows =
                document.querySelectorAll(
                    "tbody tr"
                );


            rows.forEach(
                (row) => {

                    const rowText =
                        row.textContent
                            .toLowerCase();


                    if (
                        rowText.includes(
                            searchText
                        )
                    ) {

                        row.style.display = "";

                    } else {

                        row.style.display =
                            "none";

                    }

                }
            );

        }
    );

}


/* =========================================================
   KEYBOARD SEARCH SHORTCUT
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "/" &&
            document.activeElement.tagName !== "INPUT"
        ) {

            event.preventDefault();

            globalSearch.focus();

        }

    }
);


/* =========================================================
   THEME
   ========================================================= */

let darkMode = false;


if (themeButton) {

    themeButton.addEventListener(
        "click",
        () => {

            darkMode =
                !darkMode;


            if (darkMode) {

                document.body.style.setProperty(
                    "--background",
                    "#0f172a"
                );

                document.body.style.setProperty(
                    "--surface",
                    "#111827"
                );

                document.body.style.setProperty(
                    "--text",
                    "#f8fafc"
                );

                document.body.style.setProperty(
                    "--border",
                    "#1e293b"
                );

                document.body.classList.add(
                    "dark-mode"
                );

            } else {

                document.body.style.setProperty(
                    "--background",
                    "#f7f8fc"
                );

                document.body.style.setProperty(
                    "--surface",
                    "#ffffff"
                );

                document.body.style.setProperty(
                    "--text",
                    "#0f172a"
                );

                document.body.style.setProperty(
                    "--border",
                    "#e5e7eb"
                );

                document.body.classList.remove(
                    "dark-mode"
                );

            }

        }
    );

}


/* =========================================================
   NOTIFICATION BUTTON
   ========================================================= */

if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            alert(
                "You have 3 inventory alerts:\n\n" +
                "• Safety Helmet — Out of Stock\n" +
                "• Industrial Chair — Low Stock\n" +
                "• Copper Wire — Demand increased 18%"
            );

        }
    );

}


/* =========================================================
   OPERATION OPTIONS
   ========================================================= */

const operationOptions =
    document.querySelectorAll(
        ".operation-option"
    );


operationOptions.forEach(
    (option) => {

        option.addEventListener(
            "click",
            () => {

                const operationName =
                    option
                        .querySelector("strong")
                        .textContent;


                console.log(
                    "Selected operation:",
                    operationName
                );


                alert(
                    `${operationName} module will open here.`
                );

            }
        );

    }
);


/* =========================================================
   AI RECOMMENDATION
   ========================================================= */

const aiButton =
    document.querySelector(".ai-button");


if (aiButton) {

    aiButton.addEventListener(
        "click",
        () => {

            alert(
                "AI Recommendation:\n\n" +
                "Copper Wire demand is up 18%.\n" +
                "Current stock may reach the reorder threshold in 9 days.\n\n" +
                "Recommended action: Review supplier lead time and create a replenishment order."
            );

        }
    );

}


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "StockSense Inventory OS loaded successfully."
        );

    }
);