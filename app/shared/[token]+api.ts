import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { token }: Record<string, string>) {
  try {
    // Fetch the shared collection by token
    const { data: sharedCollection, error: collectionError } = await supabase
      .from('shared_collections')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();

    if (collectionError || !sharedCollection) {
      return new Response(JSON.stringify({ error: 'Shared collection not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if expired
    if (sharedCollection.expires_at && new Date(sharedCollection.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'This share has expired' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch the actual items based on collection type
    const tableName = sharedCollection.collection_type === 'wishlist'
      ? 'wishlist_items'
      : 'inventory_items';

    const { data: items, error: itemsError } = await supabase
      .from(tableName)
      .select('*')
      .in('id', sharedCollection.item_ids);

    if (itemsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch items' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch owner information
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', sharedCollection.user_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      collection: sharedCollection,
      items: items || [],
      owner: owner || { full_name: 'Anonymous', email: '' },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
