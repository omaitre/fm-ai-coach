// Test script to verify HTML import functionality
const fs = require('fs');

// Read the St Albans HTML file
const htmlContent = fs.readFileSync('./attached_assets/St Albans squad export.html', 'utf-8');

// Test the parsing logic
function parseHtmlExport(htmlContent) {
  const attributeMapping = {
    'Acc': 'Acceleration',
    'Wor': 'Work Rate', 
    'Vis': 'Vision',
    'Thr': 'Throwing',
    'Tec': 'Technique',
    'Tea': 'Teamwork',
    'Tck': 'Tackling',
    'Str': 'Strength',
    'Sta': 'Stamina',
    'TRO': 'Tendency to Rush Out',
    'Ref': 'Reflexes',
    'Pun': 'Tendency to Punch',
    'Pos': 'Positioning',
    'Pen': 'Penalty Taking',
    'Pas': 'Passing',
    'Pac': 'Pace',
    '1v1': 'One on Ones',
    'OtB': 'Off the Ball',
    'Nat': 'Natural Fitness',
    'Mar': 'Marking',
    'L Th': 'Long Throws',
    'Lon': 'Long Shots',
    'Ldr': 'Leadership',
    'Kic': 'Kicking',
    'Jum': 'Jumping Reach',
    'Hea': 'Heading',
    'Han': 'Handling',
    'Fre': 'Free Kick Taking',
    'Fla': 'Flair',
    'Fir': 'First Touch',
    'Fin': 'Finishing',
    'Ecc': 'Eccentricity',
    'Dri': 'Dribbling',
    'Det': 'Determination',
    'Dec': 'Decisions',
    'Cro': 'Crossing',
    'Cor': 'Corners',
    'Cnt': 'Concentration',
    'Cmp': 'Composure',
    'Com': 'Communication',
    'Cmd': 'Command of Area',
    'Bra': 'Bravery',
    'Bal': 'Balance',
    'Ant': 'Anticipation',
    'Agi': 'Agility',
    'Agg': 'Aggression',
    'Aer': 'Aerial Reach'
  };

  const players = [];
  const rows = htmlContent.split('<tr bgcolor="#EEEEEE">').slice(1);
  
  rows.forEach(row => {
    const cells = row.split('<td>').slice(1).map(cell => 
      cell.split('</td>')[0].trim()
    );
    
    if (cells.length < 5) return;
    
    const player = {
      name: cells[0],
      age: parseInt(cells[1]) || 0,
      currentAbility: parseInt(cells[2]) || 0,
      potentialAbility: parseInt(cells[3]) || 0,
      position: cells[4],
      attributes: []
    };
    
    const attributeKeys = Object.keys(attributeMapping);
    attributeKeys.forEach((key, index) => {
      const cellIndex = 5 + index;
      if (cellIndex < cells.length) {
        const value = parseInt(cells[cellIndex]);
        if (!isNaN(value) && value > 0) {
          player.attributes.push({
            name: attributeMapping[key],
            value: value
          });
        }
      }
    });
    
    if (player.name && player.attributes.length > 0) {
      players.push(player);
    }
  });
  
  return players;
}

const players = parseHtmlExport(htmlContent);
console.log(`Parsed ${players.length} players from HTML file:`);
players.forEach((player, index) => {
  console.log(`${index + 1}. ${player.name} (Age: ${player.age}, CA: ${player.currentAbility}, PA: ${player.potentialAbility}, Position: ${player.position}, Attributes: ${player.attributes.length})`);
});