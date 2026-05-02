import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getIpFromRequest = (req: Request) => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    ''
  ).trim();
};

const lookupCountry = async (ip: string) => {
  if (!ip) return 'Unknown';
  try {
    const resp = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'curator-edge/1.0' },
      signal: AbortSignal.timeout(1500),
    });
    if (!resp.ok) return 'Unknown';
    const data = await resp.json();
    return data?.country_code || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response('Missing Supabase env', { status: 500, headers: corsHeaders });
  }

  let payload: {
    short_code?: string;
    visitor_id?: string;
    country?: string;
    user_agent?: string;
    referrer?: string;
  } = {};

  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const shortCode = payload.short_code?.trim();
  if (!shortCode) {
    return new Response('short_code required', { status: 400, headers: corsHeaders });
  }

  const ip = getIpFromRequest(req);
  const country = payload.country || (await lookupCountry(ip));
  const userAgent = payload.user_agent || req.headers.get('user-agent') || '';
  const referrer = payload.referrer || req.headers.get('referer') || '';
  const visitorId = payload.visitor_id || crypto.randomUUID();

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc('increment_link_click', {
    p_short_code: shortCode,
    p_user_agent: userAgent,
    p_referrer: referrer,
    p_country: country,
    p_visitor_id: visitorId,
  });

  if (error) {
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ original_url: data?.original_url, country }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
