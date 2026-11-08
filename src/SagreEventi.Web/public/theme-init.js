// Applica il tema prima del primo render, per evitare il lampo bianco.
// Va caricato in modo sincrono nell'<head> di index.html (senza defer né async).
(function () {
  try {
    // Stesse classi che applica ThemeService: qui serve solo a evitare il lampo prima dell'avvio di Angular
    var classi = {
      dark: ['app-dark'],
      halloween: ['app-dark', 'app-halloween'],
      natale: ['app-natale'],
      'natale-scuro': ['app-dark', 'app-natale-scuro'],
      pasqua: ['app-pasqua'],
      ferragosto: ['app-ferragosto']
    };
    var s = localStorage.getItem('sagreeventi.theme');
    var applica = s ? classi[s] || [] : window.matchMedia('(prefers-color-scheme: dark)').matches ? classi.dark : [];
    for (var i = 0; i < applica.length; i++) document.documentElement.classList.add(applica[i]);
  } catch (e) {}
})();
