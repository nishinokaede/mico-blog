"""
IP 地理位置查询 & User-Agent 设备解析工具。
"""
import logging
import requests

logger = logging.getLogger("ip_geo")


def get_ip_geo(ip: str) -> str | None:
    """
    调用 ip-api.com 查询 IP 地理位置。
    国内 IP 精确到省/市，返回格式如 "广东省 深圳市"。
    """
    if not ip or ip in ("127.0.0.1", "::1", "localhost"):
        return None
    try:
        resp = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
        if resp.status_code != 200:
            return None
        data = resp.json()
        if data.get("status") != "success":
            return None
        country = data.get("country", "")
        region = data.get("regionName", "")
        city = data.get("city", "")
        if country == "China":
            return f"{region} {city}".strip()
        return f"{city}, {country}".strip(", ")
    except Exception:
        logger.warning(f"IP geo lookup failed for {ip}")
        return None


def parse_user_agent(ua: str) -> str:
    """
    从 User-Agent 解析设备/浏览器信息，返回可读字符串。
    示例: "Chrome 120 / Windows 10" 或 "Safari / iPhone"
    """
    if not ua:
        return ""

    os_info = ""
    if "Windows NT" in ua:
        os_info = "Windows"
    elif "Mac OS X" in ua:
        if "iPhone" in ua or "iPad" in ua:
            os_info = "iOS"
        else:
            os_info = "macOS"
    elif "Android" in ua:
        os_info = "Android"
    elif "Linux" in ua:
        os_info = "Linux"
    elif "iPhone" in ua or "iPad" in ua:
        os_info = "iOS"

    browser = ""
    if "Edg/" in ua:
        browser = "Edge"
    elif "Chrome/" in ua and "Safari/" in ua:
        browser = "Chrome"
    elif "Safari/" in ua and "Chrome/" not in ua:
        browser = "Safari"
    elif "Firefox/" in ua:
        browser = "Firefox"

    device = ""
    if "iPhone" in ua:
        device = "iPhone"
    elif "iPad" in ua:
        device = "iPad"
    elif "Android" in ua and "Mobile" in ua:
        device = "Android Phone"
    elif "Android" in ua:
        device = "Android Tablet"
    elif "Windows" in ua or "Macintosh" in ua or "Linux" in ua:
        device = "PC"

    parts = [p for p in [browser, os_info, device] if p]
    return " / ".join(parts) if parts else ""
