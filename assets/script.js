// 1. Automatically create the button and put it on the page
const themeBtn = document.createElement('button');
themeBtn.className = 'theme-toggle';
themeBtn.id = 'theme-btn';
document.body.appendChild(themeBtn);

// 2. Check the browser's memory when the page loads
const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeBtn.innerText = '☀️';
} else {
  themeBtn.innerText = '🌙';
}

// 3. Handle the click event
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  
  let theme = 'light';
  if (document.body.classList.contains('dark-mode')) {
    theme = 'dark';
    themeBtn.innerText = '☀️';
  } else {
    themeBtn.innerText = '🌙';
  }
  
  // Save the choice to memory
  localStorage.setItem('theme', theme);
});