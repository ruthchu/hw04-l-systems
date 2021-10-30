#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;

out vec4 out_Col;

void main()
{
    vec3 lightPos = vec3(0.0, 10.0, 4.0);

    float diffuseTerm = clamp(dot(normalize(fs_Nor.xyz), normalize(lightPos)), 0., 1.);
    float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    float lightIntensity = diffuseTerm + 0.3;
    out_Col = vec4(vec3(clamp(fs_Col * lightIntensity, 0.0, 1.0)), 1.);
}
