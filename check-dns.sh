#!/bin/bash

DOMAIN="zabor-i-naves.ru"
EXPECTED_IP="37.143.13.196"

echo "======================================"
echo "DNS Diagnostic Tool for $DOMAIN"
echo "======================================"
echo ""

# 1. Check A record
echo "1. A Record:"
echo "   Expected: $EXPECTED_IP"
ACTUAL_IP=$(dig $DOMAIN A +short)
echo "   Actual: $ACTUAL_IP"
if [ "$ACTUAL_IP" == "$EXPECTED_IP" ]; then
    echo "   ✅ Correct"
else
    echo "   ❌ Mismatch!"
fi
echo ""

# 2. Check CNAME for www
echo "2. CNAME for www.$DOMAIN:"
CNAME_RESULT=$(dig www.$DOMAIN CNAME +short)
if [ -z "$CNAME_RESULT" ]; then
    echo "   ❌ Not configured"
else
    echo "   ✅ Configured: $CNAME_RESULT"
fi
echo ""

# 3. Check NS records
echo "3. NS Records:"
NS_RECORDS=$(dig $DOMAIN NS +short)
echo "$NS_RECORDS" | while read ns; do
    echo "   - $ns"
done
echo ""

# 4. Check TTL
echo "4. TTL Value:"
TTL_VALUE=$(dig $DOMAIN A +noall +answer | awk '{print $2, $3, $4}')
echo "   $TTL_VALUE"
echo ""

# 5. Check from different DNS servers
echo "5. DNS Propagation Check:"
echo ""
echo "   Google DNS (8.8.8.8):"
GOOGLE_IP=$(dig @8.8.8.8 $DOMAIN A +short)
echo "   $GOOGLE_IP"
if [ "$GOOGLE_IP" == "$EXPECTED_IP" ]; then
    echo "   ✅ Correct"
else
    echo "   ❌ Mismatch!"
fi
echo ""

echo "   Cloudflare DNS (1.1.1.1):"
CLOUDFLARE_IP=$(dig @1.1.1.1 $DOMAIN A +short)
echo "   $CLOUDFLARE_IP"
if [ "$CLOUDFLARE_IP" == "$EXPECTED_IP" ]; then
    echo "   ✅ Correct"
else
    echo "   ❌ Mismatch!"
fi
echo ""

# 6. Check DNSSEC
echo "6. DNSSEC Status:"
DNSSEC_FLAGS=$(dig +dnssec $DOMAIN A | grep "flags:")
if [[ "$DNSSEC_FLAGS" == *"ad"* ]]; then
    echo "   ✅ DNSSEC enabled"
else
    echo "   ℹ️ DNSSEC not enabled (optional for small sites)"
fi
echo ""

# 7. Check HTTP/HTTPS
echo "7. Server Response:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ 2>&1)
echo "   HTTP Status: $HTTP_STATUS"

HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ 2>&1)
echo "   HTTPS Status: $HTTPS_STATUS"
echo ""

# 8. Check robots.txt
echo "8. robots.txt Check:"
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/robots.txt 2>&1)
if [ "$ROBOTS_STATUS" == "200" ]; then
    echo "   ✅ robots.txt is accessible"
else
    echo "   ❌ robots.txt error: $ROBOTS_STATUS"
fi
echo ""

# 9. Check sitemap.xml
echo "9. sitemap.xml Check:"
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/sitemap.xml 2>&1)
if [ "$SITEMAP_STATUS" == "200" ]; then
    echo "   ✅ sitemap.xml is accessible"
else
    echo "   ❌ sitemap.xml error: $SITEMAP_STATUS"
fi
echo ""

# Summary
echo "======================================"
echo "Summary:"
echo "======================================"
echo ""

# Count issues
ISSUES=0

if [ "$ACTUAL_IP" != "$EXPECTED_IP" ]; then
    echo "❌ A record mismatch"
    ((ISSUES++))
fi

if [ -z "$CNAME_RESULT" ]; then
    echo "❌ Missing CNAME for www"
    ((ISSUES++))
fi

if [ "$ROBOTS_STATUS" != "200" ]; then
    echo "❌ robots.txt not accessible"
    ((ISSUES++))
fi

if [ "$SITEMAP_STATUS" != "200" ]; then
    echo "❌ sitemap.xml not accessible"
    ((ISSUES++))
fi

if [ "$ISSUES" -eq 0 ]; then
    echo "✅ No critical DNS issues found"
else
    echo "⚠️ Found $ISSUES issue(s) that need attention"
fi

echo ""
echo "For detailed setup instructions, see: docs/DNS_SETUP.md"
echo "======================================"
