const fs = require('fs');

let code = fs.readFileSync('src/pages/TrangChu.tsx', 'utf8');

// 1. Replace PickleballIcon with FootballIcon
code = code.replace(
  /const PickleballIcon = \(\) => \([\s\S]*?<\/svg>\n\);/,
  "const FootballIcon = () => (\n  <svg className=\"w-6 h-6\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n    <circle cx=\"12\" cy=\"12\" r=\"10\" />\n    <path d=\"M12 22v-4\" />\n    <path d=\"M12 6V2\" />\n    <path d=\"M4.93 19.07l2.83-2.83\" />\n    <path d=\"M16.24 7.76l2.83-2.83\" />\n    <path d=\"M2 12h4\" />\n    <path d=\"M18 12h4\" />\n    <path d=\"M4.93 4.93l2.83 2.83\" />\n    <path d=\"M16.24 16.24l2.83 2.83\" />\n  </svg>\n);"
);

// 2. Replace pickleball in useState and default state
code = code.replace(
  /useState<'badminton' \| 'pickleball' \| 'volleyball'>\('badminton'\)/,
  "useState<'badminton' | 'football' | 'volleyball'>('badminton')"
);

// 3. Replace sportsData pickleball with football
const newFootballData = "football: {\n      id: 'football',\n      name: 'Bóng Đá',\n      badge: 'BÓNG ĐÁ',\n      tagline: 'SÂN CỎ NHÂN TẠO',\n      title: 'Sân Bóng Đá Tiêu Chuẩn',\n      description: 'Sân bóng đá cỏ nhân tạo đạt chuẩn, không gian rộng rãi. 8 sân cầu lông có thể gộp thành 1 sân bóng đá.',\n      specs: ['SÂN 7 NGƯỜI', 'ĐÈN LUX 1000', 'CỎ NHÂN TẠO'],\n      pricePerHour: 300000,\n      priceLabel: '300.000đ / GIỜ',\n      image: '/images/hero_arena.jpg',\n      icon: FootballIcon,\n      courts: [],\n    }";

code = code.replace(
  /pickleball: \{[\s\S]*?courts: \[.*?\]\,\n    \},/,
  newFootballData + ','
);

// Fix other courts inside sportsData just to be safe
code = code.replace(/courts: \['Sân 01', 'Sân 02', 'Sân 03', 'Sân 04', 'Sân 05', 'Sân 06'\],/, "courts: [],");
code = code.replace(/courts: \['Sân BC 01', 'Sân BC 02'\],/, "courts: [],");

// 4. Inject Dynamic Available Courts logic
const logicInjection = "  // Dynamic capacity logic: 8 Badminton = 2 Volleyball = 1 Football\n  const mockBookings = [\n    { date: 'Hôm nay (18/09)', time: '17:00', sport: 'volleyball' }, // uses 4 capacity\n  ];\n\n  const getAvailableCourts = (sportId, date, time) => {\n    let usedCapacity = 0;\n    mockBookings.forEach(b => {\n      if (b.date === date && b.time === time) {\n        if (b.sport === 'football') usedCapacity += 8;\n        if (b.sport === 'volleyball') usedCapacity += 4;\n        if (b.sport === 'badminton') usedCapacity += 1;\n      }\n    });\n\n    const available = 8 - usedCapacity;\n    const courts = [];\n    if (sportId === 'football') {\n      const count = Math.floor(available / 8);\n      for(let i=1; i<=count; i++) courts.push('Sân Bóng Đá ' + i);\n    } else if (sportId === 'volleyball') {\n      const count = Math.floor(available / 4);\n      for(let i=1; i<=count; i++) courts.push('Sân Bóng Chuyền ' + i);\n    } else {\n      for(let i=1; i<=available; i++) courts.push('Sân Cầu Lông ' + i);\n    }\n    return courts.length > 0 ? courts : ['Hết sân trống'];\n  };\n\n  const availableCourts = getAvailableCourts(selectedSportId, selectedDate, selectedStartTime);\n\n  useEffect(() => {\n    if (!availableCourts.includes(selectedCourt)) {\n      setSelectedCourt(availableCourts[0]);\n    }\n  }, [selectedSportId, selectedDate, selectedStartTime, availableCourts]);\n";

code = code.replace(
  /const allStartTimes = generateStartTimes\(\);\n  const availableDurations = getAvailableDurations\(selectedStartTime\);/,
  logicInjection + "\n  const allStartTimes = generateStartTimes();\n  const availableDurations = getAvailableDurations(selectedStartTime);"
);

// Update Court renderer to use availableCourts instead of currentSport.courts
code = code.replace(
  /\{currentSport\.courts\.map\(\(court\) => \{/g,
  "{availableCourts.map((court) => {"
);

// Update Sport Select handler to use availableCourts[0] instead of sportsData[key].courts[0]
code = code.replace(
  /setSelectedCourt\(sportsData\[sportKey\]\.courts\[0\]\);/,
  "" // Handled by useEffect now
);
code = code.replace(
  /handleSportSelect\(sport\.id as any\);/,
  "setSelectedSportId(sport.id as any);"
);
code = code.replace(
  /handleSportSelect\(key\)/g,
  "setSelectedSportId(key as any)"
);

// Fix any leftover handleSportSelect reference
code = code.replace(
  /const handleSportSelect = \([^)]*\) => \{\s*setSelectedSportId\([^)]*\);\s*\};\s*/,
  ""
);

fs.writeFileSync('src/pages/TrangChu.tsx', code, 'utf8');
console.log('Done!');
