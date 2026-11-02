(() => {
  const $ = (s) => document.querySelector(s);
  const client = window.TOR_SUPABASE_CLIENT;
  const say = (message, good=false) => { const box=$('#notice'); if(box){box.textContent=message;box.className='notice show '+(good?'good':'bad');} };
  const esc = (v='') => String(v).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const go = (url) => location.href=url;
  async function currentProfile(){
    const {data:{session},error:sessionError}=await client.auth.getSession();
    if(sessionError) throw sessionError;
    const user=session?.user || null;
    if(!user) return {user:null,profile:null};
    const {data:profile,error}=await client.from('profiles').select('*').eq('id',user.id).maybeSingle();
    if(error) throw error; return {user,profile};
  }
  async function register(){
    const full_name=$('#full_name').value.trim(), username=$('#username').value.trim(), email=$('#email').value.trim();
    const efootball_id=$('#efootball_id').value.trim(), squad=$('#squad').value, jersey_number=$('#jersey_number').value.trim();
    const bio=$('#bio').value.trim(), facebook_url=$('#facebook_url').value.trim(), device_name=$('#device_name').value.trim(), cobeg_profile_url=$('#cobeg_profile_url').value.trim(), password=$('#password').value, confirm=$('#confirm_password').value;
    if(facebook_url && !/^https?:\/\//i.test(facebook_url)) return say('Enter a valid Facebook profile link starting with https://');
    if(cobeg_profile_url && (!/^https?:\/\//i.test(cobeg_profile_url) || !/^https?:\/\/(www\.)?cobegbd\.com\/player\//i.test(cobeg_profile_url))) return say('Enter a valid public COBEG player profile link.');
    if(password.length<8) return say('Password must be at least 8 characters.');
    if(password!==confirm) return say('Passwords do not match.');
    if(!/^\d+$/.test(jersey_number)) return say('Jersey number must be a number.');
    const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name,username,efootball_id,squad,jersey_number:Number(jersey_number),bio,facebook_url,device_name,cobeg_profile_url}}});
    if(error) return say(error.message);
    say(data.session?'Registration submitted. Your account is pending Admin approval.':'Registration submitted. Check your email to confirm your account; Admin approval is also required.',true);
    $('#register-form').reset();
  }
  async function login(){
    const email=$('#email').value.trim(),password=$('#password').value;
    const {error}=await client.auth.signInWithPassword({email,password}); if(error) return say(error.message);
    go('portal-profile.html');
  }
  async function logout(){await client.auth.signOut();go('portal-login.html');}
  async function profilePage(){
    const {user,profile}=await currentProfile(); if(!user) return go('portal-login.html');
    if(!profile) return say('Profile record not found. Contact the club administrator.');
    $('#profile-name').textContent=profile.full_name||profile.username;
    $('#profile-username').textContent='@'+profile.username;
    $('#profile-status').textContent=profile.approval_status.toUpperCase()+' · '+profile.role.toUpperCase();
    $('#profile-email').textContent=user.email||profile.email||'—';
    $('#profile-id').textContent=profile.efootball_id||'—'; $('#profile-squad').textContent=profile.squad||'—';
    $('#profile-jersey').textContent=profile.jersey_number??'—'; $('#bio').value=profile.bio||'';
    const facebookUrl=profile.facebook_url||user.user_metadata?.facebook_url||'';
    const deviceName=profile.device_name||user.user_metadata?.device_name||'';
    const cobegUrl=profile.cobeg_profile_url||user.user_metadata?.cobeg_profile_url||'';
    $('#facebook-url').value=facebookUrl; $('#device-name').value=deviceName; $('#cobeg-profile-url').value=cobegUrl;
    $('#profile-cobeg').innerHTML=cobegUrl?`<a href="${esc(cobegUrl)}" target="_blank" rel="noopener noreferrer">Open COBEG Profile ↗</a>`:'Not linked';
    $('#cobeg-profile-panel').innerHTML=cobegUrl?`<p><b>Profile linked</b></p><p><a class="btn secondary mini" href="${esc(cobegUrl)}" target="_blank" rel="noopener noreferrer">View Official COBEG Profile ↗</a></p><small class="muted">Live statistics sync is pending official COBEG API/data access.</small>`:'<p class="muted">No COBEG profile linked yet. Add your profile link below and save.</p>';
    $('#profile-facebook').innerHTML=facebookUrl?`<a href="${esc(facebookUrl)}" target="_blank" rel="noopener noreferrer">Open Facebook</a>`:'—';
    $('#profile-device').textContent=deviceName||'—';
    $('#avatar-url').value=profile.avatar_url||'';
    if(profile.avatar_url) $('#avatar-preview').src=profile.avatar_url;
    $('#save-profile').addEventListener('click',async()=>{
      const facebook_url=$('#facebook-url').value.trim();
      if(facebook_url && !/^https?:\/\//i.test(facebook_url)) return say('Enter a valid Facebook profile link starting with https://');
      const cobeg_profile_url=$('#cobeg-profile-url').value.trim();
      if(cobeg_profile_url && (!/^https?:\/\//i.test(cobeg_profile_url) || !/^https?:\/\/(www\.)?cobegbd\.com\/player\//i.test(cobeg_profile_url))) return say('Enter a valid public COBEG player profile link.');
      const updates={bio:$('#bio').value.trim(),avatar_url:$('#avatar-url').value.trim()||null,facebook_url:facebook_url||null,device_name:$('#device-name').value.trim()||null,cobeg_profile_url:cobeg_profile_url||null};
      const {error}=await client.from('profiles').update(updates).eq('id',user.id);
      if(error) say(error.message); else { $('#profile-facebook').innerHTML=facebook_url?`<a href="${esc(facebook_url)}" target="_blank" rel="noopener noreferrer">Open Facebook</a>`:'—'; $('#profile-device').textContent=updates.device_name||'—'; $('#profile-cobeg').innerHTML=cobeg_profile_url?`<a href="${esc(cobeg_profile_url)}" target="_blank" rel="noopener noreferrer">Open COBEG Profile ↗</a>`:'Not linked'; $('#cobeg-profile-panel').innerHTML=cobeg_profile_url?`<p><b>Profile linked</b></p><p><a class="btn secondary mini" href="${esc(cobeg_profile_url)}" target="_blank" rel="noopener noreferrer">View Official COBEG Profile ↗</a></p><small class="muted">Live statistics sync is pending official COBEG API/data access.</small>`:'<p class="muted">No COBEG profile linked yet.</p>'; say('Profile updated.',true); }
    });
    if(profile.role==='admin'||profile.role==='super_admin') $('#admin-link').hidden=false;
    if(profile.approval_status!=='approved') say('Your registration is '+profile.approval_status+'. You can sign in, but your player profile will appear after Admin approval.',true);
  }
  function playerCard(p){return `<article class="card player-card"><div class="player-top"><img src="${esc(p.avatar_url||'assets/tornado-extreme-logo.jpg')}" alt=""><span class="pill">${esc(p.squad)}</span></div><h3>${esc(p.full_name||p.username)}</h3><p class="muted">@${esc(p.username)} · #${esc(p.jersey_number??'—')}</p><p class="muted">eFootball ID: ${esc(p.efootball_id||'—')}</p>${p.cobeg_profile_url?`<p><a class="btn secondary mini" href="${esc(p.cobeg_profile_url)}" target="_blank" rel="noopener noreferrer">COBEG Profile ↗</a></p>`:''}</article>`;}
  async function playersPage(){
    const host=$('#players-list');
    const {data,error}=await client.from('profiles').select('id,username,full_name,efootball_id,jersey_number,squad,bio,avatar_url,cobeg_profile_url').eq('approval_status','approved').order('squad').order('username');
    if(error) return say(error.message);
    const params=new URLSearchParams(location.search);
    const allowed=['MAIN','ACADEMY','YOUTH','LEGEND'];
    let selected=(params.get('squad')||'ALL').toUpperCase();
    if(!allowed.includes(selected)) selected='ALL';
    const filter=$('#squad-filter'), search=$('#player-search');
    if(filter) filter.value=selected;
    const title=$('#roster-title'), intro=$('#roster-intro');
    const render=()=>{
      const term=(search?.value||'').trim().toLowerCase();
      const rows=(data||[]).filter(p=>(selected==='ALL'||(p.squad||'').toUpperCase()===selected) && (!term||[p.full_name,p.username,p.efootball_id,String(p.jersey_number??'')].some(v=>String(v||'').toLowerCase().includes(term))));
      if(title) title.innerHTML=selected==='ALL'?'OUR <span>PLAYERS</span>':`${selected} <span>SQUAD</span>`;
      if(intro) intro.textContent=selected==='ALL'?'Explore approved players across all Tornado Extreme squads.':`Official approved player roster of the TORNADO EXTREME ${selected} squad.`;
      host.innerHTML=rows.length?rows.map(playerCard).join(''):`<div class="placeholder">${term?'No players match your search.':'No approved players in this squad yet.'}</div>`;
      const count=$('#roster-count'); if(count) count.textContent=`${rows.length} PLAYER${rows.length===1?'':'S'}`;
    };
    filter?.addEventListener('change',()=>{selected=filter.value;const url=new URL(location.href);if(selected==='ALL')url.searchParams.delete('squad');else url.searchParams.set('squad',selected);history.replaceState({},'',url);render();});
    search?.addEventListener('input',render);
    render();
  }
  async function teamsPage(){
    const {data,error}=await client.from('profiles').select('id,username,full_name,efootball_id,jersey_number,squad,avatar_url,cobeg_profile_url').eq('approval_status','approved').order('username');
    if(error) return say(error.message);
    const groups=['MAIN','ACADEMY','YOUTH','LEGEND'];
    groups.forEach(squad=>{const host=document.querySelector(`[data-squad-roster="${squad}"]`);if(!host)return;const members=(data||[]).filter(p=>(p.squad||'').toUpperCase()===squad);host.innerHTML=members.length?members.map(playerCard).join(''):'<p class="muted">No approved players listed yet.</p>';});
  }
  async function adminPage(){
    const host=$('#pending-list');
    try {
      const {user,profile}=await currentProfile();
      if(!user){ say('You are not logged in. Please login first.'); return; }
      if(!profile){ say('Your profile could not be read. Check Supabase profiles SELECT policy.'); return; }
      if(!['admin','super_admin'].includes(profile.role)){ say('Admin access only. Current role: '+(profile.role||'unknown')); return; }
      $('#admin-role').textContent=profile.role.replace('_',' ').toUpperCase();
      const {data:pending,error}=await client.from('profiles').select('*').eq('approval_status','pending').order('created_at');
      if(error){ say('Could not load pending applications: '+error.message); host.innerHTML='<p class="muted">Unable to load applications. Check RLS policies.</p>'; return; }
      host.innerHTML=(pending||[]).map(p=>`<div class="admin-row"><div><b>${esc(p.full_name||p.username)}</b><small>@${esc(p.username)} · ${esc(p.squad)} · #${esc(p.jersey_number??'—')} · ${esc(p.efootball_id||'—')}</small></div><div class="actions"><button class="btn mini" data-review="approved" data-id="${p.id}">Approve</button><button class="btn secondary mini" data-review="rejected" data-id="${p.id}">Reject</button></div></div>`).join('')||'<p class="muted">No pending applications.</p>';
      host.onclick=async e=>{
        const b=e.target.closest('[data-review]'); if(!b)return;
        b.disabled=true;
        const {error}=await client.rpc('review_player',{target_id:b.dataset.id,new_status:b.dataset.review});
        if(error){ b.disabled=false; say('Review failed: '+error.message); }
        else { say('Application '+b.dataset.review+'.',true); await adminPage(); }
      };
      if(profile.role==='super_admin'){
        $('#super-admin-tools').hidden=false;
        const {data:admins,error:ae}=await client.from('profiles').select('id,username,full_name,role').in('role',['admin','super_admin']).order('role');
        if(ae) say('Could not load admins: '+ae.message);
        $('#admins-list').innerHTML=(admins||[]).map(a=>`<div class="admin-row"><div><b>${esc(a.full_name||a.username)}</b><small>@${esc(a.username)} · ${esc(a.role)}</small></div>${a.role==='admin'?`<button class="btn secondary mini" data-demote="${a.id}">Remove Admin</button>`:''}</div>`).join('');
        $('#admins-list').onclick=async e=>{const b=e.target.closest('[data-demote]');if(!b)return;if(!confirm('Remove this Admin role?'))return;const {error}=await client.rpc('set_admin_role',{target_id:b.dataset.demote,new_role:'player'});if(error)say(error.message);else{say('Admin role removed.',true);await adminPage();}};
        $('#appoint-admin').onclick=async()=>{const id=$('#admin-user-id').value.trim();if(!id)return say('Enter the user UUID.');const {error}=await client.rpc('set_admin_role',{target_id:id,new_role:'admin'});if(error)say(error.message);else{say('Admin appointed.',true);$('#admin-user-id').value='';await adminPage();}};
      }
    } catch(err) { say('Dashboard error: '+(err?.message||String(err))); }
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    const page=document.body.dataset.portal;
    if($('#register-form'))$('#register-form').addEventListener('submit',e=>{e.preventDefault();register();});
    if($('#login-form'))$('#login-form').addEventListener('submit',e=>{e.preventDefault();login();});
    if(page==='profile')try{await profilePage();}catch(e){say(e.message);}
    if(page==='admin')try{await adminPage();}catch(e){say(e.message);}
    if(page==='players')try{await playersPage();}catch(e){say(e.message);}
    if(page==='teams')try{await teamsPage();}catch(e){say(e.message);}
  });
})();
