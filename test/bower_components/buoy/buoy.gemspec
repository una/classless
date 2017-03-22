$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "buoy/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "buoy"
  s.version     = Buoy::VERSION
  s.authors     = ["Jesse Chase", "Joel Califa", "Earl Carlson", "Colin Keany"]
  s.email       = ["jesse@digitalocean.com"]
  s.homepage    = "http://digitalocean.com"
  s.summary     = "The DigitalOcean Styleguide"
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]

  s.add_dependency "rails", ">= 4.0"
end
