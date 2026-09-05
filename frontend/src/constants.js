const asset = (name) => `/assets/${encodeURIComponent(name)}`

export const CATEGORIES = [
  {
    value: 'air_pollution',
    label: 'Air Pollution',
    blurb: 'Smoke, industrial emissions, or unusual odors.',
    color: 'category-air',
    image: asset('air-pollution.jpg'),
  },
  {
    value: 'electricity',
    label: 'Electricity',
    blurb: 'Outages, exposed wires, or streetlight failures.',
    color: 'category-electricity',
    image: asset('electricity.jpg'),
  },
  {
    value: 'road',
    label: 'Road Construction',
    blurb: 'Potholes, damaged sidewalks, or unsafe work zones.',
    color: 'category-road',
    image: asset('roadconstruction (1).jpg'),
  },
  {
    value: 'sewage',
    label: 'Sewage & Water',
    blurb: 'Burst pipes, flooding, or contaminated supply.',
    color: 'category-sewage',
    image: asset('sewer.jpg'),
  },
  {
    value: 'waste',
    label: 'Waste Management',
    blurb: 'Missed collection, dumping, or overflowing bins.',
    color: 'category-waste',
    image: asset('recycle.jpg'),
  },
  {
    value: 'others',
    label: 'Others',
    blurb: 'Noise, stray animals, or general municipal issues.',
    color: 'category-others',
    image: asset('others.jpeg'),
  },
]

export const CAROUSEL_IMAGES = [
  'dreamvizag.jpg',
  'vizag1.jpg',
  'brightcity.jpg',
  'smartcity.jpg',
  'viewpoint2.jpg',
].map(asset)

export const GALLERY_IMAGES = [
  'dreamvizag.jpg',
  'vizag1.jpg',
  'brightcity.jpg',
  'smartcity2.jpg',
  'viewpoint.jpg',
].map(asset)

export const BRANDING = {
  hero: asset('smartcity.jpg'),
  auth: asset('viewpoint2.jpg'),
  sea: asset('sea.jpg'),
}
