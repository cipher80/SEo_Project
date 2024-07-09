document.getElementById('fetchDataBtn').addEventListener('click', () => {
    fetch('/api/search-analytics')
      .then(response => response.json())
      .then(data => {
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = ''; // Clear previous data
  
        data.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.query}</td>
            <td>${item.clicks}</td>
            <td>${item.impressions}</td>
            <td>${(item.ctr * 100).toFixed(2)}%</td>
            <td>${item.position.toFixed(2)}</td>
          `;
          tableBody.appendChild(row);
        });
      })
      .catch(error => console.error('Error fetching data:', error));
  });
      