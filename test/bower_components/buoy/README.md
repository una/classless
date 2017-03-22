# Buoy: The DigitalOcean UI Kit

Welcome to **Buoy** — a collection of css classes and components to promote code reusability, rapid development, and a highly mantainable code base.

## Running Locally
```
bundle install # install gems
bundle exec middleman server
```

## Getting Started

While every component has a particular scss file, all styleguide related scss files are compiled into one master file `style.css`. This represents all patterns, mixings, variables, and component styles.

## Style Overrides

Regularly, pages will require css overrides. These are handled by creating additional css file which are placed after `style.css`.

## OOCSS

Buoy is based on an underlying prinicipal of object oriented css (OOCSS) - a method of writing css that encourages shared classes, and avoids specificity.

### Some Guidelines

*   Don't use the descendent selector (i.e. don’t use `.sidebar h3`)
*   Avoid IDs as styling hooks, but behavior hooks OK (js)
*   Avoid attaching classes to elements in your stylesheet (i.e. don’t do `div.header` or `h1.title`)

## Units

Buoy uses the rem (root-em) unit which is relative to the root, or the `html` element. Globally, rem units are a percentage of the baseline font-size of 16px.

## Updating other projects which use Buoy

If you're using this as a gem, for example, in `cloud`, then you can use `bundle` to update buoy.

If the `Gemfile` is locked to a SHA, it'll look like

```ruby
gem 'buoy',
  git: 'https://b1da65e0e624808de959dcb0e5b19542833c4ef8:x-oauth-basic@github.internal.digitalocean.com/digitalocean/buoy.git',
  ref: '90cce937bc85f9ed5b00f9f6ca6681823bfe3427'
```

You should:

1. Push your changes to `master` on this repo. Copy the SHA of this latest commit: [on the Github repo](https://github.internal.digitalocean.com/digitalocean/buoy), click the blue clipboard next to 'latest commit', or grab it from `git` on the command line.
1. Edit the `Gemfile` to update the `ref` for buoy. In the cloud directory, run `bundle install`.
1. Commit the changes to `Gemfile` and `Gemfile.lock`.

Otherwise, if the `Gemfile` looks like

```ruby
gem 'buoy',
  git: 'https://b1da65e0e624808de959dcb0e5b19542833c4ef8:x-oauth-basic@github.internal.digitalocean.com/digitalocean/buoy.git',
  ref: 'HEAD'
```

1. Push your changes to `master` on this repo.
2. In cloud, run `bundle update buoy`
3. Profit.

If the styles still aren't updating, try deleting your `tmp/cache` folder or restarting the server.

## Working with Buoy locally

If you want your local Buoy changes to affect cloud, find is line in your Gemfile:

```ruby
gem 'buoy',
  git: 'https://b1da65e0e624808de959dcb0e5b19542833c4ef8:x-oauth-basic@github.internal.digitalocean.com/digitalocean/buoy.git',
  ref: 'HEAD'
```

Comment out the first two lines and add a `path` to your local folder.

```ruby
gem 'buoy',
  # git: 'https://b1da65e0e624808de959dcb0e5b19542833c4ef8:x-oauth-basic@github.internal.digitalocean.com/digitalocean/buoy.git',
  # ref: 'HEAD'
  path: '../buoy'
```

Be sure to switch this back before you push your code.

### Not seeing the latest changes?

If you're not seeing the latest code, Rails Asset Pipeline might not be clearing its cache, just remove the `tmp` directory in the app you're working in.

##Updating Icons
The process to update icons is as follows:

1. Outline all icons. If a stroke icon, they should have a 3px stroke and should be centered on a 40px x 40px artboard. Use pathfinder to combine shapes.
2. Export as SVG
3. Import into icomoon. UN: joel@digitalocean.com PW: Sammy11
4. Change font name to buoycons and add all font files to two directories: fonts dir in bupoy and fonts dir on cloud (this is temporary)
5. Update icons.scss and icons.erb in buoy
