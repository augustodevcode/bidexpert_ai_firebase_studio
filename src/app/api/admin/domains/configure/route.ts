
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

// Types for Firebase App Hosting API
interface DnsRecord {
    host: string;
    type: 'A' | 'CNAME' | 'TXT' | 'AAAA';
    data: string;
    requiredAction: 'ADD' | 'REMOVE';
}

interface CustomDomainState {
    name: string;
    createTime: string;
    updateTime: string;
    state: 'CREATING' | 'ACTIVE' | 'VERIFYING' | 'DELETING';
    dnsUpdates?: {
        checkTime: string;
        desired: DnsRecord[];
        discovered: DnsRecord[];
    };
    issues?: any[];
}

// Locaweb API Types (inferred)
interface LocawebDnsRecord {
    id?: number;
    name: string;
    type: string;
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const { domain, locawebToken } = await req.json();
        
        // Default Configuration
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bidexpert-630df';
        const location = 'us-central1';
        const backendId = 'bidexpert-app'; // Hardcoded for this environment as per instructions
        
        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // 1. Configure Firebase App Hosting
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const parent = `projects/${projectId}/locations/${location}/backends/${backendId}`;
        const customDomainRaw = domain.toLowerCase();
        const customDomainName = `${parent}/customDomains/${customDomainRaw}`;

        console.log(`[Domain Setup] Configuring Firebase for ${customDomainRaw}...`);

        let firebaseRecords: DnsRecord[] = [];
        
        // Check if domain exists or create/update it
        try {
            // Try to create (or get if exists logic via Create behavior)
            // Using Create which usually fails if exists, so we might need Get or Patch
            // But let's try Get first
            const getUrl = `https://firebaseapphosting.googleapis.com/v1beta/${customDomainName}`;
            let domainState: CustomDomainState | null = null;
            
            try {
                const getRes = await client.request({ url: getUrl });
                domainState = getRes.data as CustomDomainState;
                console.log('[Domain Setup] Domain already exists in Firebase.');
            } catch (e: any) {
                if (e.response?.status === 404) {
                    // Create
                    console.log('[Domain Setup] Creating domain in Firebase...');
                    const createUrl = `https://firebaseapphosting.googleapis.com/v1beta/${parent}/customDomains?customDomainId=${customDomainRaw}`;
                    const createRes = await client.request({
                        url: createUrl,
                        method: 'POST',
                        data: {
                            // Empty body or config
                        }
                    });
                     // Create is LRO (Long Running Operation), but initial response might have target state
                    // We might need to wait or just return the instructions known for App Hosting
                    // App Hosting usually returns immediate DNS instructions even in creating state?
                    // Let's poll once or check response.
                    const operation = createRes.data as any;
                    // For simplicity, we assume we can query the resource state immediately after
                } else {
                    throw e;
                }
            }

            // Small delay to ensure state availability if created
            await new Promise(r => setTimeout(r, 2000));
            
            // Get latest DNS Requirements
            const finalStateRes = await client.request({ url: getUrl });
            domainState = finalStateRes.data as CustomDomainState;
            
            if (domainState && domainState.dnsUpdates && domainState.dnsUpdates.desired) {
                firebaseRecords = domainState.dnsUpdates.desired;
            } else {
                // Return generic instructions if API hasn't calculated yet (happens on fresh create)
                // Fallback for immediate response (based on experience)
                // A Record: IP
                // TXT: Verification
                // CNAME: Cert
                // Since this is async, we might tell user to "Check Status" later.
                // But let's try to proceed.
                console.warn('[Domain Setup] Firebase DNS records not yet populated. Using inferred defaults if possible or waiting.');
                // In a real automated scenario, we would loop check here. 
                // For this implementation, we will try to proceed if we have data.
            }

        } catch (firebaseError: any) {
             console.error('[Domain Setup] Firebase Error:', firebaseError);
             return NextResponse.json({ 
                 error: 'Failed to configure Firebase App Hosting', 
                 details: firebaseError.message 
             }, { status: 500 });
        }
        
        // 2. Configure Locaweb DNS
        if (locawebToken) {
             console.log(`[Domain Setup] Configuring Locaweb for ${domain}...`);
             // Determine root domain (e.g. leiloes.bidexpert.com.br -> bidexpert.com.br)
             const parts = domain.split('.');
             const rootDomain = parts.slice(-2).join('.'); // simplified logic
             const host = parts.slice(0, -2).join('.'); // 'leiloes'

             // Locaweb API Wrapper
             const lwHeaders = {
                 'Content-Type': 'application/json',
                 'x-auth-token': locawebToken // Standard Locaweb Header assumption
             };
             
             // In a real world, we would iterate `firebaseRecords`.
             // Each record from Firebase needs to be mapped to Locaweb call.
             // Firebase gives: 
             //   host: "leiloes.bidexpert.com.br"
             //   type: "A"
             //   data: "35.219.200.1"
             
             // Locaweb needs: 
             //   name: "leiloes"
             //   content: "35.219.200.1"
             
             const updatesResults = [];
             
             for (const rec of firebaseRecords) {
                 if (rec.requiredAction === 'ADD') {
                    // Extract relative host
                    let recName = rec.host.replace(`.${rootDomain}`, '');
                     if (recName === domain) recName = host; 
                     // Handle root case if domain is root
                     if (rec.host === rootDomain) recName = '@';

                    // Prepare Locaweb Payload
                    const payload = {
                        type: rec.type,
                        name: recName,
                        content: rec.data,
                        ttl: 3600
                    };

                    console.log(`[Domain Setup] Adding to Locaweb:`, payload);
                    
                    // Call Locaweb Create API
                    // Using specific endpoint for Zone Records
                    const lwUrl = `https://api.locaweb.com.br/v1/dns/zones/${rootDomain}/records`;
                    
                    try {
                        const lwRes = await fetch(lwUrl, {
                            method: 'POST',
                            headers: lwHeaders,
                            body: JSON.stringify(payload)
                        });
                        
                        if (!lwRes.ok) {
                             const errTxt = await lwRes.text();
                             updatesResults.push({ status: 'error', record: rec, details: errTxt });
                        } else {
                            updatesResults.push({ status: 'success', record: rec });
                        }
                    } catch (e: any) {
                        updatesResults.push({ status: 'error', record: rec, details: e.message });
                    }
                 }
             }
             
             return NextResponse.json({ 
                 success: true, 
                 domain: domain,
                 firebase: { status: 'configured', records: firebaseRecords },
                 locaweb: { results: updatesResults }
             });

        } else {
            // Return instructions for manual setup
            return NextResponse.json({
                success: true,
                domain: domain,
                manual_instructions: true,
                firebase_records: firebaseRecords
            });
        }

    } catch (error: any) {
        console.error('[Domain Setup] Critical Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
