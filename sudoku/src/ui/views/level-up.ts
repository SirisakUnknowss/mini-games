// =====================================================================
// Level-up modal — shown when a daily/practice submit raises level
// =====================================================================

export interface LevelUpProps {
  newLevel: number;
  rewardCoins?: number;
  onContinue?: () => void;
}

export function showLevelUpModal(props: LevelUpProps): void {
  const existing = document.getElementById('lvl-modal-root');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'lvl-modal-root';
  wrapper.className = 'modal-bg active';
  wrapper.innerHTML = `
    <div class="modal lvl-modal">
      <div class="lvl-stars">⭐</div>
      <h2>Level up!</h2>
      <div class="big-number">${props.newLevel}</div>
      <p style="opacity:0.85;">You've reached level ${props.newLevel}.</p>
      ${props.rewardCoins ? `<p style="margin-top:8px;">💰 +${props.rewardCoins} bonus coins</p>` : ''}
      <div class="modal-buttons">
        <button class="btn" id="lvl-continue">Awesome!</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  wrapper.querySelector('#lvl-continue')?.addEventListener('click', () => {
    wrapper.remove();
    props.onContinue?.();
  });
}
