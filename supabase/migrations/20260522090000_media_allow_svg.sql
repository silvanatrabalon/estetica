-- The logo can be an SVG (it is shown in an <img>, where scripts inside the file never run).
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
 where id = 'media';
