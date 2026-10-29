import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculates the Great Circle distance (in kilometers) between two points
    given their latitude and longitude in decimal degrees.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0.0

    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371.0 # Radius of Earth in kilometers
    return round(c * r, 2)


def calculate_eta_minutes(distance_km, speed_kmh=25.0):
    """
    Calculates estimated time of arrival (in minutes) based on distance (km)
    and average urban transit speed (km/h). Adds base dispatch buffer of 3 mins.
    """
    if distance_km <= 0:
        return 3
    hours = distance_km / speed_kmh
    minutes = math.ceil(hours * 60.0) + 3 # 3 mins preparation buffer
    return max(minutes, 4)
