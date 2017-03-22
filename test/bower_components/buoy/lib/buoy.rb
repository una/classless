module Buoy
  if defined?(Rails)
    class Engine < Rails::Engine
      initializer :assets do |config|
        %w(stylesheets images/buoy fonts/buoycons javascripts/buoy).each do |component_path|
          Rails.application.config.assets.paths << root.join('app/assets', component_path)
        end
        %w(buoycons.eot buoycons.svg  buoycons.ttf buoycons.woff sub.svg wave-dark.svg wave-light.svg wave-white.svg).each do |asset|
          Rails.application.config.assets.precompile << asset
        end
      end
    end
  end
end
