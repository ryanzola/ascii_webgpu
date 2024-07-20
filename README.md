# Smooth Particle Animation with GPGPU and Poisson Sampling

A simple demonstration of how to create a smooth particle animation using GPGPU and Poisson Sampling.

![Poisson Disk Sampling](https://storage.googleapis.com/rz_github_images/poisson.png)

## Overview

The particles are generated using Poisson Sampling and are animated using GPGPU. The particles are rendered using a simple shader that renders the particles as circles. The project is inspired by the particle animations seen in [Digital Design Days](https://ddd.live/) by [Lusion Studio](https://lusion.co/).

## Features

- Poisson Disk Sampling for particle generation
- GPGPU for particle animation
- Curl Noise for particle movement
