require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Corrected project data with proper format
const projectsData = [
  {
    company: "Cube Holding Ltd",
    projectName: "Gohon",
    description: "(G+9) Residential building with 3200 sqft per floor, Animation Fair-Face finish. A modern residential complex in Bashundhara R/A.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "3200 sqft", 
      constructionType: "Animation Fair-Face" 
    },
    address: { 
      plot: "106 & 107", 
      road: "6", 
      block: "I", 
      area: "Bashundhara R/A", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2023-01-01"),
    finishDate: null,
    featured: true,
    images: [{ url: "https://i.ibb.co/7JfxfDJG/Gahon.jpg", isPrimary: true }]
  },
  {
    company: "Cube Holding Ltd",
    projectName: "Abesh",
    description: "(G+9) Residential building with 3400 sqft per floor, Animation Fair-Face finish. Premium residential project in Bashundhara.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "3400 sqft", 
      constructionType: "Animation Fair-Face" 
    },
    address: { 
      plot: "121 & 128", 
      road: "5 & 6", 
      block: "I", 
      area: "Bashundhara R/A", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2024-01-01"),
    finishDate: null,
    featured: true,
    images: [
      { url: "https://i.ibb.co/60CQN9NB/Abesh.jpg", isPrimary: true },
      { url: "https://i.ibb.co/xKhVKXvq/Abesh2.jpg" },
      { url: "https://i.ibb.co/q3Y1KTWv/Abesh3.jpg" }
    ]
  },
  {
    company: "Cube Holding Ltd",
    projectName: "Bistry",
    description: "(G+9) Residential building with 1800 sqft per floor, Animation Fair-Face finish. Compact and efficient residential design.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "1800 sqft", 
      constructionType: "Animation Fair-Face" 
    },
    address: { 
      plot: "121 & 128", 
      road: "18", 
      block: "F", 
      area: "Bashundhara R/A", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2023-01-01"),
    finishDate: null,
    featured: true,
    images: [
      { url: "https://i.ibb.co/n8wZtzPC/Birsti.jpg", isPrimary: true },
      { url: "https://i.ibb.co/FkFDB05n/Birsti2.jpg" }
    ]
  },
  {
    company: "SA Construction",
    projectName: "Bindabon",
    description: "(G+9) Residential building with 5200 sqft per floor in Uttara. Spacious apartments with modern amenities.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "5200 sqft" 
    },
    address: { 
      area: "Sector-17, Uttara", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2024-01-01"),
    finishDate: null,
    images: []
  },
  {
    company: "Akota Holding Ltd",
    projectName: "Akota Tower",
    description: "Two Basement, Ground Floor and 9-story residential building with 2000 sqft per floor. Full Fair-Face finish with premium construction quality.",
    specifications: { 
      floors: "2B+G+9", 
      areaPerFloor: "2000 sqft", 
      constructionType: "Full Fair-Face" 
    },
    address: { 
      plot: "House # 01", 
      road: "28", 
      area: "Sector-07, Uttara", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2025-01-01"),
    finishDate: null,
    images: []
  },
  {
    company: "Iconic Building Ltd",
    projectName: "Lake View 1",
    description: "(G+9) Residential building with 6800 sqft per floor. Lakeside residential complex in Comilla with beautiful views.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "6800 sqft" 
    },
    address: { 
      area: "Darmosagor Par", 
      city: "Comilla" 
    },
    status: "Finished", 
    startDate: new Date("2010-01-01"),
    finishDate: new Date("2013-12-31"),
    images: []
  },
  {
    company: "Iconic Building Ltd",
    projectName: "Lake View 2",
    description: "(G+9) Residential building with 7200 sqft per floor, Animation Fair-Face finish. Second phase of the Lake View project.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "7200 sqft", 
      constructionType: "Animation Fair-Face" 
    },
    address: { 
      area: "Darmosagor Par", 
      city: "Comilla" 
    },
    status: "Finished", 
    startDate: new Date("2023-01-01"),
    finishDate: new Date("2026-01-01"),
    images: []
  },
  {
    company: "JMI Builders & Construction Ltd",
    projectName: "JMI Siria Jahan Nibash",
    description: "(G+9) Residential building with 2300 sqft per floor in Narayanganj. Quality construction with modern design.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "2300 sqft" 
    },
    address: { 
      plot: "191/C", 
      road: "Sher E Bangla Road", 
      area: "Masdair, Fatulla", 
      city: "Narayanganj" 
    },
    status: "Finished", 
    startDate: new Date("2022-01-01"),
    finishDate: new Date("2025-01-01"),
    images: []
  },
  {
    company: "JMI Builders & Construction Ltd",
    projectName: "JMI Shahnawaz Mansion",
    description: "(G+9) Residential building with 4600 sqft per floor in Vatara. Luxury residential apartments with spacious layouts.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "4600 sqft" 
    },
    address: { 
      plot: "Ka-51/2", 
      area: "Jagannathpur, Vatara", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2022-01-01"),
    finishDate: null,
    images: [
      { url: "https://i.ibb.co/yF9N8PW2/shahanax1.jpg", isPrimary: true }
    ]
  },
  {
    company: "JMI Builders & Construction Ltd",
    projectName: "JMI The Four Gables",
    description: "(G+8) Residential building with 2600 sqft per floor in Bashundhara. Modern residential complex with excellent amenities.",
    specifications: { 
      floors: "G+8", 
      areaPerFloor: "2600 sqft" 
    },
    address: { 
      plot: "2981 & 2982", 
      road: "17", 
      block: "M", 
      area: "Bashundhara R/A", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2024-01-01"),
    finishDate: null,
    images: []
  },
  {
    company: "Sisal Composite Ltd",
    projectName: "Sisal Factory Building",
    description: "G+5 commercial and industrial building with 18000 sqft per floor. Large-scale industrial facility in Bashundhara.",
    specifications: { 
      floors: "G+5", 
      areaPerFloor: "18000 sqft",
      constructionType: "Commercial/Industrial"
    },
    address: { 
      plot: "2981 & 2982", 
      road: "17", 
      block: "M", 
      area: "Bashundhara R/A", 
      city: "Dhaka" 
    },
    status: "Finished", 
    startDate: new Date("2024-01-01"),
    finishDate: new Date("2024-12-31"),
    images: []
  },
  {
    company: "Akota Holding Ltd",
    projectName: "Eastern University Student Hall",
    description: "One Basement, Ground Floor and 5-story residential building with 2000 sqft per floor. Student accommodation with Full Fair-Face finish.",
    specifications: { 
      floors: "1B+G+5", 
      areaPerFloor: "2000 sqft", 
      constructionType: "Full Fair-Face" 
    },
    address: { 
      area: "Ashulia, Savar", 
      city: "Dhaka" 
    },
    status: "Finished", 
    startDate: new Date("2020-01-01"),
    finishDate: new Date("2022-12-31"),
    images: []
  },
  {
    company: "Private Client",
    projectName: "Doctor Home Nawnadigir",
    description: "One Basement, Ground Floor and 9-story luxury residential building with 7000 sqft per floor in Comilla.",
    specifications: { 
      floors: "1B+G+9", 
      areaPerFloor: "7000 sqft" 
    },
    address: { 
      area: "Nawnadigir Par", 
      city: "Comilla" 
    },
    status: "Finished", 
    startDate: new Date("2017-01-01"),
    finishDate: new Date("2020-12-31"),
    images: []
  },
  {
    company: "Private Client",
    projectName: "Doctor Home Talpukur",
    description: "One Basement, Ground Floor and 9-story luxury residential building with 8000 sqft per floor in Comilla.",
    specifications: { 
      floors: "1B+G+9", 
      areaPerFloor: "8000 sqft" 
    },
    address: { 
      area: "Talpukur Par", 
      city: "Comilla" 
    },
    status: "Finished", 
    startDate: new Date("2016-01-01"),
    finishDate: new Date("2022-12-31"),
    images: []
  },
  {
    company: "MM Construction",
    projectName: "Eden Garden",
    description: "One Basement, Ground Floor and 12-story residential building with 4000 sqft per floor. Full Fair-Face finish with premium quality construction.",
    specifications: { 
      floors: "1B+G+12", 
      areaPerFloor: "4000 sqft", 
      constructionType: "Full Fair-Face" 
    },
    address: { 
      plot: "1540 & 1541", 
      road: "37", 
      block: "M", 
      area: "Bashundhara R/A", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2024-01-01"),
    finishDate: null,
    images: []
  },
  {
    company: "Private Client",
    projectName: "Residential Project Plot 256",
    description: "Ground Floor and 9-story residential building with 2300 sqft per floor in Bashundhara. Modern residential apartments.",
    specifications: { 
      floors: "G+9", 
      areaPerFloor: "2300 sqft" 
    },
    address: { 
      plot: "256", 
      road: "2", 
      block: "L", 
      area: "Bashundhara R/A", 
      city: "Dhaka" 
    },
    status: "Ongoing", 
    startDate: new Date("2025-01-01"),
    finishDate: null,
    images: []
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing projects
    console.log('Clearing existing projects...');
    await Project.deleteMany({});

    // Insert new projects
    console.log('Inserting projects...');
    const inserted = await Project.insertMany(projectsData);

    console.log(`✅ Successfully inserted ${inserted.length} projects!`);
    console.log('\nProject Summary:');
    console.log(`- Ongoing: ${inserted.filter(p => p.status === 'Ongoing').length}`);
    console.log(`- Finished: ${inserted.filter(p => p.status === 'Finished').length}`);
    console.log(`- Featured: ${inserted.filter(p => p.featured).length}`);
    console.log(`- With Images: ${inserted.filter(p => p.images.length > 0).length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();