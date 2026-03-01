"""
Seasonal and trend adjustment module for crop price predictions.

Since the training dataset may cover a limited time window (e.g., a single month),
the base ML model cannot learn seasonal or yearly patterns on its own.

This module applies well-known agricultural seasonality patterns and inflation-based
year trends to adjust the base model's prediction, ensuring that month and year
inputs meaningfully affect the final predicted price.

Seasonality factors are based on general Indian agricultural price patterns:
- Prices tend to be LOWER right after harvest (supply glut)
- Prices tend to be HIGHER in lean months before harvest (supply shortage)

Crops are grouped into Rabi (winter), Kharif (monsoon), and perennial categories,
each with different seasonal curves.
"""

import numpy as np

# ── Crop season classification ──
# Rabi crops: sown Oct–Dec, harvested Mar–Apr → prices lowest Mar–May
# Kharif crops: sown Jun–Jul, harvested Sep–Nov → prices lowest Oct–Dec
# Perennial/year-round: mild seasonal variation

RABI_CROPS = {
    'wheat', 'barley', 'gram', 'masoor dal', 'lentil', 'mustard',
    'mustard oil', 'rapeseed', 'safflower', 'linseed', 'peas',
    'peas wet', 'peas cod', 'bengal gram(gram)(whole)',
    'gram dal', 'gram raw(chholia)', 'dry chillies',
    'isabgul', 'coriander(dhania)(seeds)', 'cumin seed(jeera)',
    'methi seeds', 'soyabean', 'sunflower', 'sesamum(sesame,gingelly,til)',
    'taramira', 'bajra(pearl millet/cum bu)', 'jowar(sorghum)',
    'maize', 'ragi (finger millet)',
}

KHARIF_CROPS = {
    'paddy(dhan)(common)', 'rice', 'rice(paddy-husked)',
    'arhar (tur/red gram)(whole)', 'arhar dal(tur dal)',
    'moong(green gram)(whole)', 'moong dal',
    'urad (black gram)(whole)', 'urad dal',
    'groundnut', 'groundnut (raw)', 'cotton',
    'cotton seed', 'sugarcane', 'guar', 'guar seed',
    'jute', 'castor seed', 'niger seed(ramtil)',
    'turmeric', 'turmeric (raw)',
    'green chilli', 'bhindi(ladies finger)',
    'bitter gourd', 'bottle gourd', 'brinjal',
    'cucumber(kheera)', 'pumpkin', 'sponge gourd', 'ridge gourd',
}

# ── Monthly seasonal factors (multipliers around 1.0) ──
# Index 0 = January, Index 11 = December

# Rabi: harvest Mar–Apr, prices lowest Mar–May, highest Oct–Feb
RABI_SEASONAL = np.array([
    1.08,  # Jan — pre-harvest, supply tight
    1.05,  # Feb — just before harvest
    0.92,  # Mar — harvest begins, supply glut
    0.88,  # Apr — peak harvest, lowest prices
    0.90,  # May — post-harvest, still high supply
    0.95,  # Jun — supply declining
    1.00,  # Jul — moderate
    1.02,  # Aug — supply shrinking
    1.05,  # Sep — lean season starts
    1.08,  # Oct — high demand, low supply
    1.06,  # Nov — pre-sowing season
    1.04,  # Dec — sowing period
])

# Kharif: harvest Oct–Nov, prices lowest Oct–Dec, highest Apr–Jul
KHARIF_SEASONAL = np.array([
    1.02,  # Jan
    1.04,  # Feb — supply from kharif dwindling
    1.06,  # Mar — lean period
    1.10,  # Apr — peak lean season
    1.08,  # May — pre-monsoon, high prices
    1.05,  # Jun — monsoon starts, new sowing
    1.00,  # Jul — moderate
    0.97,  # Aug — early arrivals
    0.94,  # Sep — harvest begins
    0.90,  # Oct — peak harvest
    0.88,  # Nov — oversupply
    0.95,  # Dec — post-harvest
])

# Perennial / year-round crops: minimal seasonal effect
PERENNIAL_SEASONAL = np.array([
    1.02, 0.99, 0.97, 0.96, 0.98, 1.00,
    1.01, 1.02, 1.03, 1.02, 1.00, 0.99,
])

# Annual price inflation factor (approximate Indian agri-commodity trend)
# ~3-5% annual increase — use 4% as baseline
ANNUAL_INFLATION_RATE = 0.04
REFERENCE_YEAR = 2026  # Year the training data comes from


def classify_crop(commodity_name: str) -> str:
    """Classify a commodity into rabi, kharif, or perennial."""
    name_lower = commodity_name.strip().lower()
    if name_lower in {c.lower() for c in RABI_CROPS}:
        return 'rabi'
    if name_lower in {c.lower() for c in KHARIF_CROPS}:
        return 'kharif'
    return 'perennial'


def get_seasonal_factor(commodity: str, month: int) -> float:
    """
    Get the seasonal price adjustment factor for a commodity and month.

    Args:
        commodity: Crop name
        month: Month (1-12)

    Returns:
        float: Multiplier (e.g. 1.08 means +8%, 0.90 means -10%)
    """
    crop_type = classify_crop(commodity)
    month_idx = int(month) - 1  # Convert to 0-indexed

    if crop_type == 'rabi':
        return float(RABI_SEASONAL[month_idx])
    elif crop_type == 'kharif':
        return float(KHARIF_SEASONAL[month_idx])
    else:
        return float(PERENNIAL_SEASONAL[month_idx])


def get_year_trend_factor(year: int) -> float:
    """
    Get the year-based trend adjustment factor relative to reference year.

    Args:
        year: Target year

    Returns:
        float: Multiplier for year trend (e.g. 1.04 for one year ahead)
    """
    years_diff = int(year) - REFERENCE_YEAR
    return (1 + ANNUAL_INFLATION_RATE) ** years_diff


def adjust_prediction(base_price: float, commodity: str, month: int, year: int) -> float:
    """
    Apply seasonal and trend adjustments to a base price prediction.

    The base model predicts a price using crop/market/state features.
    This function adjusts it for temporal effects that the base model
    can't learn from limited training data.

    Args:
        base_price: Raw prediction from the ML model
        commodity: Crop name
        month: Month (1-12)
        year: Year

    Returns:
        float: Seasonally and trend-adjusted price
    """
    seasonal = get_seasonal_factor(commodity, month)
    trend = get_year_trend_factor(year)

    # The base model was trained on March 2026 data.
    # Undo the March seasonal factor (since the base prediction already
    # implicitly includes March's seasonal effect) and apply the target month's factor.
    base_month = 3  # March
    base_seasonal = get_seasonal_factor(commodity, base_month)

    # Relative seasonal adjustment: target_month / base_month
    relative_seasonal = seasonal / base_seasonal

    adjusted = base_price * relative_seasonal * trend
    return round(adjusted, 2)
