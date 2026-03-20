# GigGuard: AI-Powered Income Protection for Food Delivery Partners

## About the Project
GigGuard is an AI-first InsurTech concept focused on income-loss protection for food delivery partners affected by external disruptions. The current repository implementation is an interactive web demonstration that showcases the rider and insurer/admin experience for parametric policy monitoring, risk intelligence, and anti-spoofing operations.

The project originated from a practical gig-economy challenge: delivery partners can lose earnings due to events they cannot control, including weather shocks, payment outages, route paralysis, and access restrictions. The core product vision is a zero-touch policy model where verified trigger conditions can initiate compensation workflows without traditional manual claim friction.

This implementation demonstrates that vision as a production-style UI system with two operating views. It combines scenario-driven state presentation, risk trend analytics, and fraud-monitoring cards to communicate how policy logic would be consumed by real users and operations teams.

## Current Implementation Snapshot
- Built module: responsive React dashboard prototype in [demo_website](demo_website).
- Rider view: active protection card, alert status blocks, and recent payout timeline.
- Command center view: policy KPIs, dynamic risk-premium charting, and anti-spoofing feed.
- Data model in app: mock telemetry and risk-series data rendered through Recharts.
- Scope status: frontend prototype is implemented; backend trigger engine and payout automation are documented but not yet wired in this codebase.

## Inspiration
The inspiration is the financial fragility of incentive-based delivery work. A single disruption window can materially reduce weekly income, especially when streak-based incentives are impacted. GigGuard was shaped to make disruption-linked income protection objective, fast, and understandable.

## What it does
The implemented demo communicates the complete operational flow of the concept:

- Shows how a protected rider would see weekly coverage and event-linked payouts.
- Exposes insurer-grade monitoring for active policies, liquidity posture, and fraud flags.
- Visualizes dynamic risk and premium movement across the week.
- Simulates anti-spoofing review actions such as syndicate blocking and async proof requests.

## How we built it
The current implementation is built as a modern frontend prototype:

- Framework: React 19 with Vite 5.
- Styling: Tailwind CSS v4 plus utility composition.
- Visualization: Recharts for trend and premium analytics views.
- Iconography/UI signals: Lucide React.
- Linting: ESLint 9 flat config with React Hooks and React Refresh plugins.

### Weekly premium model
Inline form: \(\text{Premium}_{\text{weekly}}\) combines base cost, weighted risk factors, and behavior-based discounts.

Displayed form:
$$
	ext{Premium}_{\text{weekly}} = B + \left(\sum_{i=1}^{n} w_i r_i\right) - \alpha S_{\text{rider}}
$$

Where:
- \(B\): weekly base rate.
- \(w_i r_i\): weighted risk contribution for each disruption factor.
- \(S_{\text{rider}}\): rider safety or trust score.
- \(\alpha\): coefficient controlling discount influence.

### Run the demo locally
1. Open [demo_website](demo_website).
2. Install dependencies: `npm install`.
3. Start development server: `npm run dev`.
4. Build for production preview: `npm run build` and `npm run preview`.

## Challenges we ran into
- Translating a complex insurance workflow into a UI that is intuitive for both riders and insurer operators.
- Balancing dense operational data with readability so dashboards remain actionable on first glance.
- Converting a conceptual backend-heavy system into a meaningful frontend demo without misleading implementation claims.
- Designing anti-spoofing and anomaly states in a way that is realistic, explainable, and easy to present during evaluation.
- Keeping the React code modular while rapidly iterating on visual structure, cards, charts, and status components.

## Accomplishments that we're proud of
- Built a polished dual-view dashboard experience: Rider POV and Insurer Command Center.
- Implemented an analytics panel with dynamic risk-premium trend visualization using Recharts.
- Modeled key operational widgets such as policy KPIs, payout history, alerts, and fraud-flag feeds.
- Established a modern frontend setup with React 19, Vite 5, Tailwind CSS v4, and ESLint flat configuration.
- Created a demo flow that clearly communicates product value to judges, stakeholders, and non-technical audiences.

## What we learned
- A strong demo must communicate system behavior clearly, even when backend services are not yet integrated.
- Dashboard storytelling matters: layout hierarchy, status colors, and card grouping directly affect decision clarity.
- Recharts and utility-first styling accelerate iteration when exploring multiple risk and operations views.
- Product credibility improves when the README explicitly distinguishes implemented features from planned architecture.
- Building early for two user personas (rider and insurer) surfaces better UX decisions than single-view prototyping.

## What's next for GigGuard
- Add a real backend service layer (FastAPI) to replace mock dashboard data with live policy and telemetry endpoints.
- Integrate weather, traffic, and outage APIs to drive real trigger-state updates in the UI.
- Implement authentication and role-based access for rider and insurer/admin experiences.
- Introduce persistent storage for policies, incidents, payouts, and fraud-review decisions.
- Build claim-trigger simulation tooling for testing edge cases and demoing end-to-end payout workflows.
- Deploy the web app with CI/CD, monitoring, and environment-based configuration for production readiness.

## 1. Project Overview & Core Constraints
**Target Persona:** Platform-based Food Delivery Partners (e.g., Zomato, Swiggy, Zepto, Blinkit).  
**The Challenge:** Building an AI-enabled parametric insurance platform that safeguards gig workers against income loss caused by external, uncontrollable disruptions.

### Strict Compliance
*   **Loss of Income Only:** The solution provides a safety net exclusively for lost wages/hours.
*   **Exclusions:** We strictly exclude coverage for health, life, accidents, or vehicle repairs.
*   **Financial Model:** The premium and policy framework is structured strictly on a **Weekly** pricing basis to match the gig worker payout cycle.

## 2. The Problem & Comprehensive Scenarios
Food delivery partners operate on a pay-per-delivery model, relying heavily on consecutive delivery streaks to earn daily incentives. External disruptions can reduce their working hours and cause a 20-30% loss in monthly earnings. When these events occur, they bear the full financial loss.

Our platform addresses four hyper-specific scenarios that silently drain a rider's income:
1.  **Environmental - Heatwave & Hyper-Local Waterlogging**: Extreme heat during the 1 PM - 3 PM lunch rush forces riders off the road, or a single flooded underpass isolates a restaurant zone. Deliveries are halted, and peak-hour earning potential is lost.
2.  **Digital Infrastructure - The "UPI/Gateway Crash"**: A major UPI network or bank server crashes during peak dinner hours. A rider gets stuck at a customer's doorstep for 30+ minutes waiting for a payment, destroying their trips-per-hour ratio.
3.  **Urban Access - The "RWA/Gated Community Ban"**: Elite Resident Welfare Associations (RWAs) suddenly ban delivery bikes from entering premises. Riders are forced to park outside and wait 15–20 minutes.
4.  **Social/Civic - Festive Route Paralysis**: Unplanned VIP movements or religious processions paralyze arterial roads. Platform routing algorithms fail to update ETAs, trapping a rider in gridlock for over an hour for a single delivery.

## 3. Adversarial Defense & Anti-Spoofing Strategy 
*(Market Crash Phase 1 Mitigation)*

Traditional GPS verification is obsolete. Sophisticated syndicates utilize GPS-spoofing to simulate entrapment in red-alert weather zones from their homes. Our architecture defends the liquidity pool against these mass false payouts via a multi-layered verification strategy:

### The Differentiation
Our AI/ML architecture does not merely verify *where* a phone says it is; it verifies *how* the phone behaves in that environment. A genuinely stranded delivery partner’s device signature behaves completely differently from a stationary, spoofed device on a couch. The AI cross-references simulated trajectory patterns with physical telemetry data to validate actual presence in extreme weather or gridlock.

### The Data Points Analyzed
To detect coordinated fraud rings without solely relying on GPS coordinates, out system analyzes:
1.  **Sensory & Kinematic Telemetry**: Accelerometer and Gyroscope patterns. A rider pushing a bike through a flooded street or waiting in extreme heat produces distinct micro-movements, unlike a stationary phone.
2.  **Network Cell Tower Triangulation Consistency**: We validate the GPS data against the connected cellular towers and Wi-Fi MAC addresses in the vicinity. Spoofed GPS coordinates will not match the physical cell tower handoffs.
3.  **"Flock Anomalies" (Crowdsourced Graph Analysis)**: If 50 riders suddenly claim they are stuck in the exact same 500-meter radius, our isolation forest models compare their battery drain rates, signal strengths, and background app activity. Synchronized anomalies indicate a coordinated bot farm or syndicate using the same spoofing app.

### The UX Balance
Legitimate workers experiencing genuine network drops in bad weather must not be penalized. 
*   **Soft Flags vs. Hard Flags**: If a claim is flagged as "Suspicious" due to weak network data, we do not reject it outright. Instead, the payout is placed in a "Pending Verification" state.
*   **Asynchronous Proof**: The app allows the rider to submit asynchronous proof (e.g., a short video or timestamped photo of the flooded street or the closed RWA gate) once their network connection is stable.
*   **Trust Scores**: Riders with high historical trust scores and established behavioural baselines are granted "Benefit of the Doubt" auto-approvals for minor infractions, ensuring honest gig workers retain their safety net.

## 4. Parametric Automation & Intelligent Triggers
Our solution utilizes zero-touch parametric automation to monitor triggers and process instant payouts.
*   **Weather API Integrations**: Monitors localized "Feels Like" temperatures (>45°C) and severe rainfall warnings to automatically trigger "Climate Pauses".
*   **Dwell-Time & Network Outages**: Integrates with DownDetector/NPCI status mocks. If a rider's GPS shows them dwelling at a drop-off for >20 minutes during a known UPI outage, the policy triggers.
*   **Crowdsourced Anomaly Detection**: If multiple riders across platforms suddenly experience a 300% spike in wait times at a specific apartment complex.
*   **Live Traffic Intersections**: Uses Google Maps API mocks to detect if a rider is forced into a "stationary" traffic zone (speed <3 km/h for 45+ mins) during an assigned trip.

## 5. AI-Powered Risk Assessment & Dynamic Pricing
Because gig workers cannot afford flat monthly fees, our model calculates a dynamic premium every Sunday for the upcoming week based on hyper-local predictive risk modeling.

### The Weekly Premium Equation
`Premium = BaseRate + Σ(RiskFactor * Weight) - (SafetyScore * DiscountMultiplier)`
*   `BaseRate`: The minimum viable operational cost.
*   `RiskFactor`: Predictive AI output for weather, civic events, or infrastructure stability in the rider's specific zone.
*   `Weight`: The localized importance of that specific risk.
*   `SafetyScore`: AI-assessed reliability of the rider to prevent adverse selection.

## 6. Technology Stack & Platform Strategy
Food delivery partners operate exclusively via mobile; however, we provide an interactive **Responsive Web Dashboard** serving both the Rider interface (mobile-view) and the Insurer/Admin interface (desktop-view) for complete visibility.

*   **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Recharts (for Analytics)
*   **Backend & AI Context**: Python (FastAPI), Scikit-Learn (Predictive Pricing), Isolation Forests (Fraud Detection)
*   **Database Structure**: PostgreSQL / Firebase (Real-time telemetry)
*   **Mock Integrations**: OpenWeatherMap API, Google Maps Traffic API, Razorpay Test Mode for instant payout processing.

---
### Running the Demo
1. Navigate to `demo_website` folderr
2. Run `npm install`
3. Run `npm run dev`
4. Access the dashboard to view real-time risk assessments, active weekly policies, and the anti-spoofing command center.
