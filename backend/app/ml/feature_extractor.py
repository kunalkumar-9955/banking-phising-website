"""
PhishGuard AI - Feature Extraction Engine
Extracts features from URLs for phishing detection using Associative Classification.
"""

import re
import socket
import ssl
import urllib.parse
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
import dns.resolver
import requests
from bs4 import BeautifulSoup


class FeatureExtractor:
    """Extract features from a URL for phishing classification."""

    SUSPICIOUS_KEYWORDS = [
        "login", "signin", "verify", "update", "secure", "account",
        "banking", "confirm", "password", "credential", "suspend",
        "restricted", "unlock", "alert", "notification", "security",
        "authenticate", "validation", "recover", "restore", "unusual",
        "limited", "expire", "urgent", "immediately", "click",
        "paypal", "ebay", "amazon", "apple", "microsoft", "google",
        "netflix", "bank", "chase", "wells", "citi", "hsbc"
    ]

    LEGITIMATE_TLDS = [
        ".com", ".org", ".net", ".edu", ".gov", ".mil",
        ".co.uk", ".ac.uk", ".gov.uk"
    ]

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        self.session.verify = False
        self.timeout = 10

    def extract_all_features(self, url: str) -> Dict[str, Any]:
        """Extract all features from a URL."""
        features = {}
        details = []

        # URL-based features
        url_features, url_details = self._extract_url_features(url)
        features.update(url_features)
        details.extend(url_details)

        # Domain-based features
        domain_features, domain_details = self._extract_domain_features(url)
        features.update(domain_features)
        details.extend(domain_details)

        # SSL features
        ssl_features, ssl_details, ssl_info = self._extract_ssl_features(url)
        features.update(ssl_features)
        details.extend(ssl_details)

        # Content-based features
        content_features, content_details = self._extract_content_features(url)
        features.update(content_features)
        details.extend(content_details)

        return {
            "features": features,
            "details": details,
            "ssl_info": ssl_info if 'ssl_info' in dir() and ssl_info else {},
            "domain_info": domain_features.get("_domain_info", {})
        }

    def _extract_url_features(self, url: str) -> Tuple[Dict, List]:
        """Extract URL-based features."""
        features = {}
        details = []
        parsed = urllib.parse.urlparse(url)

        # URL length
        url_length = len(url)
        features["url_length"] = url_length
        if url_length > 75:
            features["url_length_suspicious"] = 1
            details.append({
                "name": "URL Length",
                "value": str(url_length),
                "risk_level": "danger" if url_length > 100 else "warning",
                "description": f"URL is {url_length} characters long. Phishing URLs are often unusually long to hide the real domain."
            })
        else:
            features["url_length_suspicious"] = 0
            details.append({
                "name": "URL Length",
                "value": str(url_length),
                "risk_level": "safe",
                "description": "URL length is within normal range."
            })

        # Has IP address
        ip_pattern = re.compile(
            r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|'
            r'(0x[0-9a-fA-F]{1,2}\.[0-9a-fA-F]{1,2}\.[0-9a-fA-F]{1,2}\.[0-9a-fA-F]{1,2})'
        )
        has_ip = 1 if ip_pattern.search(parsed.netloc) else 0
        features["has_ip_address"] = has_ip
        if has_ip:
            details.append({
                "name": "IP Address in URL",
                "value": "Detected",
                "risk_level": "danger",
                "description": "URL uses an IP address instead of a domain name. This is a strong phishing indicator."
            })

        # Has @ symbol
        has_at = 1 if "@" in url else 0
        features["has_at_symbol"] = has_at
        if has_at:
            details.append({
                "name": "@ Symbol in URL",
                "value": "Detected",
                "risk_level": "danger",
                "description": "The @ symbol in a URL can redirect to a different site than shown."
            })

        # Has double slash redirect
        has_double_slash = 1 if url.count("//") > 1 else 0
        features["has_double_slash_redirect"] = has_double_slash
        if has_double_slash:
            details.append({
                "name": "Double Slash Redirect",
                "value": "Detected",
                "risk_level": "warning",
                "description": "Multiple double slashes can indicate URL manipulation."
            })

        # Has dash in domain
        has_dash = 1 if "-" in parsed.netloc else 0
        features["has_dash_in_domain"] = has_dash
        if has_dash:
            details.append({
                "name": "Dash in Domain",
                "value": "Detected",
                "risk_level": "warning",
                "description": "Dashes in domain names are common in phishing (e.g., secure-bank-login.com)."
            })

        # Subdomain count
        domain_parts = parsed.netloc.split(".")
        subdomain_count = max(0, len(domain_parts) - 2)
        features["subdomain_count"] = subdomain_count
        if subdomain_count > 2:
            details.append({
                "name": "Multiple Subdomains",
                "value": str(subdomain_count),
                "risk_level": "warning",
                "description": f"URL has {subdomain_count} subdomains, which is unusual and potentially suspicious."
            })

        # Suspicious keywords
        url_lower = url.lower()
        found_keywords = [kw for kw in self.SUSPICIOUS_KEYWORDS if kw in url_lower]
        features["suspicious_keyword_count"] = len(found_keywords)
        if len(found_keywords) > 2:
            details.append({
                "name": "Suspicious Keywords",
                "value": ", ".join(found_keywords[:5]),
                "risk_level": "warning",
                "description": f"URL contains {len(found_keywords)} suspicious keywords commonly found in phishing URLs."
            })

        # Number of dots
        dot_count = url.count(".")
        features["dot_count"] = dot_count
        if dot_count > 4:
            details.append({
                "name": "Excessive Dots",
                "value": str(dot_count),
                "risk_level": "warning",
                "description": f"URL contains {dot_count} dots, which may indicate domain obfuscation."
            })

        # Has HTTPS
        has_https = 1 if parsed.scheme == "https" else 0
        features["has_https"] = has_https
        if not has_https:
            details.append({
                "name": "No HTTPS",
                "value": "HTTP Only",
                "risk_level": "danger",
                "description": "Website does not use HTTPS encryption. Legitimate banking sites always use HTTPS."
            })
        else:
            details.append({
                "name": "HTTPS",
                "value": "Enabled",
                "risk_level": "safe",
                "description": "Website uses HTTPS encryption."
            })

        # Path length
        path_length = len(parsed.path)
        features["path_length"] = path_length
        if path_length > 50:
            features["long_path"] = 1
        else:
            features["long_path"] = 0

        # Query parameters count
        query_params = urllib.parse.parse_qs(parsed.query)
        features["query_param_count"] = len(query_params)

        # Has port
        has_port = 1 if parsed.port and parsed.port not in [80, 443] else 0
        features["has_unusual_port"] = has_port
        if has_port:
            details.append({
                "name": "Unusual Port",
                "value": str(parsed.port),
                "risk_level": "warning",
                "description": f"Website uses non-standard port {parsed.port}."
            })

        # URL contains encoded characters
        encoded_chars = url.count("%")
        features["encoded_char_count"] = encoded_chars
        if encoded_chars > 3:
            details.append({
                "name": "URL Encoding",
                "value": f"{encoded_chars} encoded characters",
                "risk_level": "warning",
                "description": "Excessive URL encoding may be used to hide malicious content."
            })

        return features, details

    def _extract_domain_features(self, url: str) -> Tuple[Dict, List]:
        """Extract domain-based features."""
        features = {}
        details = []
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc.split(":")[0]
        domain_info = {"domain": domain}

        # DNS resolution
        try:
            answers = dns.resolver.resolve(domain, "A")
            features["dns_available"] = 1
            ip_addresses = [str(rdata) for rdata in answers]
            domain_info["ip_address"] = ip_addresses[0] if ip_addresses else "Unknown"
            details.append({
                "name": "DNS Resolution",
                "value": "Available",
                "risk_level": "safe",
                "description": "Domain resolves to a valid IP address."
            })
        except Exception:
            features["dns_available"] = 0
            domain_info["ip_address"] = "Unresolved"
            details.append({
                "name": "DNS Resolution",
                "value": "Failed",
                "risk_level": "danger",
                "description": "Domain does not resolve. This is suspicious for a banking website."
            })

        # WHOIS data
        try:
            import whois
            w = whois.whois(domain)
            if w.creation_date:
                creation = w.creation_date
                if isinstance(creation, list):
                    creation = creation[0]
                age_days = (datetime.now() - creation).days
                features["domain_age_days"] = age_days
                domain_info["creation_date"] = str(creation)
                domain_info["registrar"] = str(w.registrar) if w.registrar else "Unknown"

                if age_days < 180:
                    features["domain_young"] = 1
                    details.append({
                        "name": "Domain Age",
                        "value": f"{age_days} days",
                        "risk_level": "danger",
                        "description": f"Domain was created only {age_days} days ago. New domains are often used for phishing."
                    })
                elif age_days < 365:
                    features["domain_young"] = 1
                    details.append({
                        "name": "Domain Age",
                        "value": f"{age_days} days",
                        "risk_level": "warning",
                        "description": f"Domain is relatively new ({age_days} days old)."
                    })
                else:
                    features["domain_young"] = 0
                    details.append({
                        "name": "Domain Age",
                        "value": f"{age_days} days ({age_days // 365} years)",
                        "risk_level": "safe",
                        "description": "Domain has been registered for a reasonable period."
                    })

                # WHOIS privacy
                if w.registrant_name and "privacy" in str(w.registrant_name).lower():
                    features["whois_hidden"] = 1
                    details.append({
                        "name": "WHOIS Privacy",
                        "value": "Hidden",
                        "risk_level": "warning",
                        "description": "Domain registration details are hidden behind a privacy service."
                    })
                else:
                    features["whois_hidden"] = 0
            else:
                features["domain_age_days"] = -1
                features["domain_young"] = -1
                features["whois_hidden"] = -1
        except Exception:
            features["domain_age_days"] = -1
            features["domain_young"] = -1
            features["whois_hidden"] = -1
            domain_info["creation_date"] = "Unknown"
            domain_info["registrar"] = "Unknown"

        features["_domain_info"] = domain_info
        return features, details

    def _extract_ssl_features(self, url: str) -> Tuple[Dict, List, Dict]:
        """Extract SSL certificate features."""
        features = {}
        details = []
        ssl_info = {}
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.netloc.split(":")[0]

        try:
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()

                    # SSL valid
                    features["ssl_valid"] = 1
                    ssl_info["issuer"] = dict(x[0] for x in cert.get("issuer", []))
                    ssl_info["subject"] = dict(x[0] for x in cert.get("subject", []))
                    ssl_info["version"] = cert.get("version", "Unknown")

                    # Certificate dates
                    not_before = datetime.strptime(cert["notBefore"], "%b %d %H:%M:%S %Y %Z")
                    not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                    ssl_info["not_before"] = str(not_before)
                    ssl_info["not_after"] = str(not_after)
                    ssl_info["issuer_name"] = ssl_info["issuer"].get("organizationName", "Unknown")

                    cert_age = (datetime.now() - not_before).days
                    features["ssl_cert_age"] = cert_age

                    if cert_age < 30:
                        details.append({
                            "name": "SSL Certificate Age",
                            "value": f"{cert_age} days",
                            "risk_level": "warning",
                            "description": "SSL certificate was recently issued. Very new certificates can be suspicious."
                        })
                    else:
                        details.append({
                            "name": "SSL Certificate",
                            "value": f"Valid (Issued by {ssl_info['issuer_name']})",
                            "risk_level": "safe",
                            "description": "SSL certificate is valid and issued by a recognized authority."
                        })

        except Exception:
            features["ssl_valid"] = 0
            features["ssl_cert_age"] = -1
            ssl_info["issuer_name"] = "None"
            ssl_info["valid"] = False
            if parsed.scheme == "https":
                details.append({
                    "name": "SSL Certificate",
                    "value": "Invalid or Expired",
                    "risk_level": "danger",
                    "description": "SSL certificate is invalid, expired, or self-signed. This is a major red flag."
                })

        return features, details, ssl_info

    def _extract_content_features(self, url: str) -> Tuple[Dict, List]:
        """Extract content/behavior-based features from the webpage."""
        features = {}
        details = []

        try:
            response = self.session.get(url, timeout=self.timeout, allow_redirects=True)

            # Redirect count
            redirect_count = len(response.history)
            features["redirect_count"] = redirect_count
            if redirect_count > 3:
                details.append({
                    "name": "Excessive Redirects",
                    "value": str(redirect_count),
                    "risk_level": "danger",
                    "description": f"Website redirects {redirect_count} times. Phishing sites often use multiple redirects."
                })

            # Parse HTML
            soup = BeautifulSoup(response.text, "html.parser")

            # iFrame detection
            iframes = soup.find_all("iframe")
            features["iframe_count"] = len(iframes)
            hidden_iframes = [f for f in iframes if f.get("style") and ("hidden" in f["style"] or "display:none" in f["style"] or "visibility" in f["style"])]
            features["hidden_iframe_count"] = len(hidden_iframes)
            if hidden_iframes:
                details.append({
                    "name": "Hidden iFrames",
                    "value": f"{len(hidden_iframes)} detected",
                    "risk_level": "danger",
                    "description": "Hidden iframes can be used to load phishing content or steal credentials."
                })

            # Form analysis
            forms = soup.find_all("form")
            features["form_count"] = len(forms)
            external_forms = 0
            password_fields = 0
            for form in forms:
                action = form.get("action", "")
                if action and not action.startswith("/") and not action.startswith("#"):
                    parsed_action = urllib.parse.urlparse(action)
                    parsed_url = urllib.parse.urlparse(url)
                    if parsed_action.netloc and parsed_action.netloc != parsed_url.netloc:
                        external_forms += 1

                inputs = form.find_all("input")
                for inp in inputs:
                    if inp.get("type", "").lower() == "password":
                        password_fields += 1

            features["external_form_action"] = external_forms
            features["password_field_count"] = password_fields

            if external_forms > 0:
                details.append({
                    "name": "External Form Action",
                    "value": f"{external_forms} forms",
                    "risk_level": "danger",
                    "description": "Form submits data to a different domain. This is a strong indicator of credential theft."
                })

            if password_fields > 0 and features.get("has_https", 0) == 0:
                details.append({
                    "name": "Password on HTTP",
                    "value": "Detected",
                    "risk_level": "danger",
                    "description": "Password field detected on a non-HTTPS page. Credentials would be sent unencrypted."
                })

            # JavaScript analysis
            scripts = soup.find_all("script")
            features["script_count"] = len(scripts)

            suspicious_js = 0
            for script in scripts:
                script_text = script.string or ""
                if any(sus in script_text.lower() for sus in [
                    "eval(", "document.cookie", "window.location",
                    "unescape(", "fromcharcode", "atob(",
                    "settimeout", "document.write"
                ]):
                    suspicious_js += 1

            features["suspicious_js_count"] = suspicious_js
            if suspicious_js > 0:
                details.append({
                    "name": "Suspicious JavaScript",
                    "value": f"{suspicious_js} patterns detected",
                    "risk_level": "danger",
                    "description": "Potentially malicious JavaScript patterns detected (eval, cookie access, etc.)."
                })

            # Popup detection
            popup_scripts = sum(1 for s in scripts if s.string and "window.open" in (s.string or ""))
            features["popup_count"] = popup_scripts
            if popup_scripts > 0:
                details.append({
                    "name": "Popup Windows",
                    "value": f"{popup_scripts} detected",
                    "risk_level": "warning",
                    "description": "Website uses popup windows which can be used for fake login forms."
                })

            # Right-click disabled
            right_click = 1 if "oncontextmenu" in response.text.lower() or "event.button==2" in response.text else 0
            features["right_click_disabled"] = right_click
            if right_click:
                details.append({
                    "name": "Right-Click Disabled",
                    "value": "Yes",
                    "risk_level": "warning",
                    "description": "Website disables right-click, which is often used to prevent URL inspection."
                })

            # Favicon from external domain
            favicons = soup.find_all("link", rel=lambda x: x and "icon" in x)
            external_favicon = 0
            parsed_url = urllib.parse.urlparse(url)
            for fav in favicons:
                href = fav.get("href", "")
                if href.startswith("http"):
                    fav_domain = urllib.parse.urlparse(href).netloc
                    if fav_domain != parsed_url.netloc:
                        external_favicon = 1
                        break
            features["external_favicon"] = external_favicon
            if external_favicon:
                details.append({
                    "name": "External Favicon",
                    "value": "Detected",
                    "risk_level": "warning",
                    "description": "Favicon loaded from a different domain, may indicate site impersonation."
                })

            # Page title analysis
            title = soup.find("title")
            features["has_title"] = 1 if title and title.string else 0

            # Meta tag analysis
            meta_tags = soup.find_all("meta")
            features["meta_count"] = len(meta_tags)

        except requests.exceptions.Timeout:
            features["page_accessible"] = 0
            features["redirect_count"] = -1
            details.append({
                "name": "Page Timeout",
                "value": "Connection timed out",
                "risk_level": "warning",
                "description": "Could not load the webpage within the timeout period."
            })
        except Exception as e:
            features["page_accessible"] = 0
            features["redirect_count"] = -1
            details.append({
                "name": "Page Access",
                "value": "Failed",
                "risk_level": "warning",
                "description": f"Could not access the webpage: {str(e)[:100]}"
            })

        return features, details

    def features_to_binary(self, features: Dict) -> Dict[str, int]:
        """Convert feature values to binary for association rule mining."""
        binary = {}

        binary["url_long"] = 1 if features.get("url_length", 0) > 54 else 0
        binary["url_very_long"] = 1 if features.get("url_length", 0) > 75 else 0
        binary["has_ip"] = features.get("has_ip_address", 0)
        binary["has_at"] = features.get("has_at_symbol", 0)
        binary["has_double_slash"] = features.get("has_double_slash_redirect", 0)
        binary["has_dash"] = features.get("has_dash_in_domain", 0)
        binary["many_subdomains"] = 1 if features.get("subdomain_count", 0) > 2 else 0
        binary["many_dots"] = 1 if features.get("dot_count", 0) > 4 else 0
        binary["no_https"] = 0 if features.get("has_https", 1) else 1
        binary["ssl_invalid"] = 0 if features.get("ssl_valid", 1) else 1
        binary["new_cert"] = 1 if 0 < features.get("ssl_cert_age", 999) < 30 else 0
        binary["young_domain"] = 1 if 0 < features.get("domain_age_days", 999) < 365 else 0
        binary["very_young_domain"] = 1 if 0 < features.get("domain_age_days", 999) < 90 else 0
        binary["whois_hidden"] = features.get("whois_hidden", 0) if features.get("whois_hidden", 0) >= 0 else 0
        binary["no_dns"] = 0 if features.get("dns_available", 1) else 1
        binary["many_redirects"] = 1 if features.get("redirect_count", 0) > 3 else 0
        binary["has_iframe"] = 1 if features.get("iframe_count", 0) > 0 else 0
        binary["hidden_iframe"] = 1 if features.get("hidden_iframe_count", 0) > 0 else 0
        binary["external_form"] = 1 if features.get("external_form_action", 0) > 0 else 0
        binary["suspicious_js"] = 1 if features.get("suspicious_js_count", 0) > 0 else 0
        binary["has_popup"] = 1 if features.get("popup_count", 0) > 0 else 0
        binary["no_right_click"] = features.get("right_click_disabled", 0)
        binary["external_favicon"] = features.get("external_favicon", 0)
        binary["suspicious_keywords"] = 1 if features.get("suspicious_keyword_count", 0) > 2 else 0
        binary["unusual_port"] = features.get("has_unusual_port", 0)
        binary["long_path"] = features.get("long_path", 0)

        return binary
