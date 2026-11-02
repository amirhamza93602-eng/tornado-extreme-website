(() => {
  const $ = s => document.querySelector(s);
  const client = window.TOR_SUPABASE_CLIENT;
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notice = (m,ok=false) => {const n=$('#notice');if(n){n.textContent=m;n.className='notice show '+(ok?'good':'bad');}};
  const admin = role => ['admin','super_admin'].includes(role);
  async function getMe(){const {data:{user}}=await client.auth.getUser();if(!user){location.href='portal-login.html';return null;}const {data:p,error}=await client.from('profiles').select('*').eq('id',user.id).single();if(error)throw error;if(p.approval_status!=='approved'&&!admin(p.role)){notice('Your application is '+p.approval_status+'. Dashboard access is available after approval.');return null;}return {user,p};}
  async function dashboard(){
    try {const me=await getMe();if(!me)return;const {p}=me;
      $('#dash-name').textContent=p.full_name||p.username;$('#dash-squad').textContent=p.squad||'—';$('#dash-jersey').textContent='#'+(p.jersey_number??'—');$('#dash-verify').textContent=(p.verification_status||'unverified').toUpperCase();
      const [{data:wins,error:we},{data:ann,error:ae}] = await Promise.all([
        client.from('intra_club_wins').select('id,tournament_name,opponent_name,status,created_at').eq('player_id',me.user.id).order('created_at',{ascending:false}),
        client.from('club_announcements').select('id,title,body,created_at').order('created_at',{ascending:false}).limit(10)
      ]);
      if(we)throw we;if(ae)throw ae;
      const approved=(wins||[]).filter(x=>x.status==='approved').length;
      $('#intra-win-count').textContent=approved;$('#intra-pending-count').textContent=(wins||[]).filter(x=>x.status==='pending').length;
      $('#my-wins').innerHTML=(wins||[]).map(w=>`<div class="feature-row"><div><b>${esc(w.tournament_name)}</b><small>Opponent: ${esc(w.opponent_name)} · ${new Date(w.created_at).toLocaleDateString()}</small></div><span class="pill">${esc(w.status.toUpperCase())}</span></div>`).join('')||'<p class="muted">No intra-club wins submitted yet.</p>';
      $('#announcements').innerHTML=(ann||[]).map(a=>`<article class="feature-announcement"><h3>${esc(a.title)}</h3><p>${esc(a.body).replace(/\n/g,'<br>')}</p><small>${new Date(a.created_at).toLocaleString()}</small></article>`).join('')||'<p class="muted">No announcements yet.</p>';
      $('#verification-request').textContent=p.verification_status==='pending'?'Verification Pending':p.verification_status==='verified'?'Verified':'Request Verification';$('#verification-request').disabled=['pending','verified'].includes(p.verification_status);
      $('#win-form').addEventListener('submit',async e=>{e.preventDefault();const tournament_name=$('#win-tournament').value.trim(),opponent_name=$('#win-opponent').value.trim(),proof_url=$('#win-proof').value.trim();if(!/^https?:\/\//i.test(proof_url))return notice('Please provide a valid screenshot/proof URL.');const {error}=await client.from('intra_club_wins').insert({player_id:me.user.id,tournament_name,opponent_name,proof_url});if(error)return notice(error.message);notice('Win submitted. It will count after verification.',true);e.target.reset();location.reload();});
      $('#verification-request').addEventListener('click',async()=>{const {error}=await client.rpc('request_player_verification');if(error)return notice(error.message);notice('Verification request submitted.',true);location.reload();});
      if(admin(p.role))$('#admin-tools-link').hidden=false;
    }catch(e){notice(e.message||String(e));}
  }
  async function adminTools(){
    try{const me=await getMe();if(!me)return;if(!admin(me.p.role))return notice('Admin access only.');
      const refresh=async()=>{
        const [{data:w,error:we},{data:players,error:pe}] = await Promise.all([
          client.from('intra_club_wins').select('id,player_id,tournament_name,opponent_name,proof_url,status,created_at').order('created_at',{ascending:false}),
          client.from('profiles').select('id,username,full_name,squad,verification_status,approval_status').eq('approval_status','approved').order('username')
        ]);if(we)throw we;if(pe)throw pe;
        const ids=[...new Set((w||[]).map(x=>x.player_id).concat((players||[]).map(x=>x.id)))];let names={};if(ids.length){const {data:ps}=await client.from('profiles').select('id,username,full_name').in('id',ids);(ps||[]).forEach(x=>names[x.id]=x.full_name||x.username);}
        $('#admin-wins').innerHTML=(w||[]).map(x=>`<div class="feature-row"><div><b>${esc(names[x.player_id]||'Player')} · ${esc(x.tournament_name)}</b><small>vs ${esc(x.opponent_name)} · <a href="${esc(x.proof_url)}" target="_blank" rel="noopener">View proof</a> · ${esc(x.status)}</small></div><div class="actions"><button class="btn mini" data-win="approved" data-id="${x.id}">Approve</button><button class="btn secondary mini" data-win="rejected" data-id="${x.id}">Reject</button></div></div>`).join('')||'<p class="muted">No win submissions.</p>';
        $('#admin-players').innerHTML=(players||[]).map(x=>`<div class="feature-row"><div><b>${esc(names[x.id]||x.username)}</b><small>${esc(x.squad)} · Verification: ${esc(x.verification_status||'unverified')}</small></div><div class="actions"><select data-squad="${x.id}" aria-label="Change squad"><option ${x.squad==='MAIN'?'selected':''}>MAIN</option><option ${x.squad==='ACADEMY'?'selected':''}>ACADEMY</option><option ${x.squad==='YOUTH'?'selected':''}>YOUTH</option><option ${x.squad==='LEGEND'?'selected':''}>LEGEND</option></select><button class="btn mini" data-verify="verified" data-id="${x.id}">Verify</button><button class="btn secondary mini" data-verify="rejected" data-id="${x.id}">Reject</button></div></div>`).join('')||'<p class="muted">No approved players.</p>';
      };
      await refresh();
      $('#admin-wins').onclick=async e=>{const b=e.target.closest('[data-win]');if(!b)return;b.disabled=true;const {error}=await client.from('intra_club_wins').update({status:b.dataset.win,reviewed_by:me.user.id,reviewed_at:new Date().toISOString()}).eq('id',b.dataset.id);if(error)notice(error.message);else{notice('Win result '+b.dataset.win+'.',true);await refresh();}};
      $('#admin-players').onclick=async e=>{const b=e.target.closest('[data-verify]');if(!b)return;const {error}=await client.rpc('set_player_verification',{target_id:b.dataset.id,new_status:b.dataset.verify});if(error)notice(error.message);else{notice('Verification status updated.',true);await refresh();}};
      $('#admin-players').onchange=async e=>{const s=e.target.closest('[data-squad]');if(!s)return;const {error}=await client.rpc('manage_player_squad',{target_id:s.dataset.squad,new_squad:s.value});if(error)notice(error.message);else notice('Player squad updated.',true);};
      $('#announcement-form').onsubmit=async e=>{e.preventDefault();const {error}=await client.from('club_announcements').insert({title:$('#announcement-title').value.trim(),body:$('#announcement-body').value.trim(),created_by:me.user.id});if(error)notice(error.message);else{notice('Announcement published.',true);e.target.reset();}};
    }catch(e){notice(e.message||String(e));}
  }
  document.addEventListener('DOMContentLoaded',()=>{const page=document.body.dataset.feature;if(page==='dashboard')dashboard();if(page==='admin-tools')adminTools();});
})();
