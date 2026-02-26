import streamlit as st
from datetime import datetime, timedelta

# --- 1. CONFIG & 2026 MARKET DATA ---
st.set_page_config(page_title="Elite Award Engine 2026", layout="wide", page_icon="💎")
EXCHANGE_RATE = 90.95 

# --- 2. INTELLIGENCE LOGIC ---
def get_daily_probability(date, cabin):
    month, day_score = date.month, 75
    if month == 12: day_score -= 50
    elif month in [5, 6]: day_score -= 30
    
    days_to_fly = (date - datetime.now().date()).days
    if cabin == "First Class":
        if 0 <= days_to_fly <= 15: day_score = 90
        else: day_score = 15
            
    return max(5, min(95, day_score))

# --- 3. SIDEBAR: LIVE INPUTS ---
with st.sidebar:
    st.header("📍 Trip & Points")
    hub = st.selectbox("Departure Hub", ["Mumbai (BOM)", "Delhi (DEL)"])
    cabin = st.radio("Cabin Class", ["Business", "First Class"])
    
    st.divider()
    out_date = st.date_input("Fly Out", value=datetime(2026, 5, 15))
    in_date = st.date_input("Fly In", value=datetime(2026, 6, 1))
    
    st.divider()
    st.subheader("Your Points Inventory")
    p_chase = st.number_input("Chase (UR)", value=85000, step=5000)
    p_amex = st.number_input("Amex (MR)", value=120000, step=5000)
    p_cap1 = st.number_input("Capital One", value=50000, step=5000)
    p_bilt = st.number_input("Bilt Rewards", value=30000, step=5000)
    total_pool = p_chase + p_amex + p_cap1 + p_bilt

# --- 4. CALCULATIONS ---
pts_per_leg = 88000 if cabin == "Business" else 140000
total_needed = pts_per_leg * 2
shortfall = total_needed - total_pool
cpp = ((8200 if cabin == "Business" else 21000) / total_needed) * 100

# --- 5. MAIN DASHBOARD ---
st.title("Elite Award Intelligence Engine")

# 7-Day Outbound Heatmap
st.subheader("📅 7-Day Outbound Forecast")
cal_cols = st.columns(7)
start_cal = out_date - timedelta(days=3)
for i in range(7):
    day = start_cal + timedelta(days=i)
    prob = get_daily_probability(day, cabin)
    color = "🟢" if prob > 70 else "🟡" if prob > 40 else "🔴"
    with cal_cols[i]:
        st.markdown(f"**{day.strftime('%a %d')}**\n\n{color}\n\n**{prob}%**")

st.divider()

# --- 6. REAL-TIME ANALYSIS (DYNAMIC) ---
st.subheader("📊 Round-Trip Point Analysis")
c1, c2, c3 = st.columns(3)
c1.metric("Required Points", f"{total_needed:,}")
c2.metric("Point Value (CPP)", f"{cpp:.1f}¢")
status_label = "READY TO BOOK" if shortfall <= 0 else f"SHORTFALL: {shortfall:,}"
c3.metric("Status", status_label, delta=-shortfall if shortfall > 0 else "Ready", delta_color="inverse")

# --- 7. DYNAMIC CC STRATEGY ---
st.subheader("🚀 Strategic Card Recommendations")
if shortfall > 0:
    st.warning(f"You need {shortfall:,} more points for this Round Trip.")
    # Dynamic card logic based on shortfall and date
    if shortfall <= 80000:
        st.info("**Card Recommendation: United Quest℠ Card**\n\n- **Bonus**: 80,000 Miles (Ends April 1, 2026).\n- **Impact**: Bridges your gap completely and adds 2x free checked bags.")
    elif shortfall <= 175000:
        st.info("**Card Recommendation: Amex Platinum**\n\n- **Bonus**: 175,000 Points (Targeted Offer Feb 2026).\n- **Impact**: Covers almost the entire round trip. Transfer to Aeroplan for Business class.")
else:
    st.success("✅ **Strategy**: You are point-liquid! Use **Bilt** or **Chase** first for United bookings to save Amex for Aeroplan.")

# --- 8. SAVER SEAT FINDER (THE CHECKLIST) ---
st.divider()
st.subheader("🔍 Where to Find Saver Seats")
col_l, col_r = st.columns(2)

with col_l:
    st.markdown("""
    **Check United.com for:**
    - **Air India** (Lowest taxes)
    - **United Polaris** (Best for BOM-EWR)
    - *Tip: If you have a United Card, you get extra 'XN' saver inventory.*
    """)
    
with col_r:
    st.markdown("""
    **Check AirCanada.com for:**
    - **Lufthansa / Swiss / Austrian**
    - **Turkish Airlines** (via Istanbul)
    - *Tip: Use 'PointsYeah' to set a free alert if no space shows today.*
    """)

# --- 9. THE "POINT-MOVE" PLAYBOOK ---
with st.expander("🛠️ TRANSFER PLAYBOOK: Which Points to Move?"):
    st.markdown(f"""
    1. **Move AMEX/CAP1 first** to **Air Canada Aeroplan**. These are 'stiff' points (they can't go to United).
    2. **Save CHASE/BILT** for **United MileagePlus**. These are 'flexible' points and your only way to book Air India without huge surcharges.
    3. **The 1st of the Month**: If today is near the 1st, **STOP**. Wait for Bilt Rent Day to see if there is a 75-100% transfer bonus.
    4. **Refundable**: United awards are free to cancel. Aeroplan awards need the **'Flex'** fare selected at checkout for a $0 fee refund.
    """)

st.caption(f"Calculated for {hub} | Taxes Est: $240 (₹{240 * EXCHANGE_RATE:,.0f})")